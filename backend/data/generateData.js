require("dotenv").config();
const waitOn = require("wait-on");
const neo4j = require("neo4j-driver");
const faker = require("faker");

const DEFAULT_USER_COUNT = parseInt(process.env.USER_COUNT || "250", 10);
const DEFAULT_TRANSACTION_COUNT = parseInt(
  process.env.TRANSACTION_COUNT || "1000",
  10
);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "1000", 10);
const ATTRIBUTE_EDGE_LIMIT = parseInt(
  process.env.ATTRIBUTE_EDGE_LIMIT || "1000",
  10
);

const getNeo4jDriver = () => {
  const uri = process.env.NEO4J_URI || "bolt://neo4j:7687";
  const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || "neo4j";
  const password =
    process.env.NEO4J_PASSWORD || process.env.NEO4J_PASS || "password";

  return neo4j.driver(uri, neo4j.auth.basic(user, password));
};

const randomSharedValue = (valuePool, chance) =>
  Math.random() < chance
    ? faker.random.arrayElement(valuePool)
    : faker.random.alphaNumeric(12);

const generateUsers = (count) => {
  const sharedEmails = Array.from({
    length: Math.max(2, Math.floor(count * 0.02)),
  }).map(() => faker.internet.email());
  const sharedPhones = Array.from({
    length: Math.max(2, Math.floor(count * 0.02)),
  }).map(() => faker.phone.phoneNumber());
  const sharedAddresses = Array.from({
    length: Math.max(2, Math.floor(count * 0.02)),
  }).map(() => faker.address.streetAddress());
  const sharedPaymentMethods = Array.from({
    length: Math.max(2, Math.floor(count * 0.015)),
  }).map(() => faker.finance.accountName());

  return Array.from({ length: count }).map((_, index) => {
    const id = `user-${index + 1}`;
    return {
      id,
      name: faker.name.findName(),
      email: randomSharedValue(sharedEmails, 0.05),
      phone: randomSharedValue(sharedPhones, 0.04),
      address: randomSharedValue(sharedAddresses, 0.03),
      paymentMethod:
        Math.random() < 0.03
          ? faker.random.arrayElement(sharedPaymentMethods)
          : faker.finance.accountName(),
    };
  });
};

const generateTransactions = (users, count) => {
  const userIds = users.map((user) => user.id);
  const devicePool = Array.from({
    length: Math.max(30, Math.floor(users.length * 0.05)),
  }).map((_, idx) => `device-${idx + 1}`);
  const ipPool = Array.from({
    length: Math.max(30, Math.floor(users.length * 0.04)),
  }).map(() => faker.internet.ip());

  return Array.from({ length: count }).map((_, index) => {
    let senderId = faker.random.arrayElement(userIds);
    let receiverId = faker.random.arrayElement(userIds);
    while (receiverId === senderId) {
      receiverId = faker.random.arrayElement(userIds);
    }

    const deviceId = faker.random.arrayElement(devicePool);
    const ip = faker.random.arrayElement(ipPool);

    return {
      id: `txn-${index + 1}`,
      amount: Number(faker.finance.amount(5, 5000, 2)),
      senderId,
      receiverId,
      ip,
      deviceId,
      createdAt:
        Date.now() -
        faker.datatype.number({ min: 0, max: 1000 * 60 * 60 * 24 * 30 }),
    };
  });
};

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const createUsers = async (session, users) => {
  console.log(`Creating ${users.length} users in batches of ${BATCH_SIZE}...`);
  for (const batch of chunk(users, BATCH_SIZE)) {
    await session.run(
      `UNWIND $users AS user
       MERGE (u:User {id: user.id})
       SET u.name = user.name,
           u.email = user.email,
           u.phone = user.phone,
           u.address = user.address,
           u.paymentMethod = user.paymentMethod`,
      { users: batch }
    );
  }
  console.log("Users created successfully.");
};

const createTransactions = async (session, transactions) => {
  console.log(
    `Creating ${transactions.length} transactions in batches of ${BATCH_SIZE}...`
  );
  for (const batch of chunk(transactions, BATCH_SIZE)) {
    await session.run(
      `UNWIND $transactions AS tx
       MATCH (sender:User {id: tx.senderId})
       MATCH (receiver:User {id: tx.receiverId})
       MERGE (t:Transaction {id: tx.id})
       SET t.amount = tx.amount,
           t.ip = tx.ip,
           t.deviceId = tx.deviceId,
           t.senderId = tx.senderId,
           t.receiverId = tx.receiverId,
           t.createdAt = tx.createdAt
       MERGE (sender)-[:DEBIT]->(t)
       MERGE (receiver)-[:CREDIT]->(t)`,
      { transactions: batch }
    );
  }
  console.log("Transactions created successfully.");
};

const linkUserAttribute = async (session, attribute, relationship) => {
  await session.run(
    `MATCH (u:User)
     WHERE u.${attribute} IS NOT NULL
     WITH u.${attribute} AS value, collect(u) AS users
     WHERE size(users) > 1
     UNWIND range(0, size(users) - 2) AS idx
     WITH value, users, idx
     LIMIT $edgeLimit
     WITH users, idx
     WITH users[idx] AS source, users[idx + 1] AS target
     MERGE (source)-[:${relationship}]->(target)`,
    { edgeLimit: neo4j.int(ATTRIBUTE_EDGE_LIMIT) }
  );
};

const linkTransactionAttribute = async (session, attribute, relationship) => {
  await session.run(
    `MATCH (t:Transaction)
     WHERE t.${attribute} IS NOT NULL
     WITH t.${attribute} AS value, collect(t) AS txs
     WHERE size(txs) > 1
     UNWIND range(0, size(txs) - 2) AS idx
     WITH value, txs, idx
     LIMIT $edgeLimit
     WITH txs, idx
     WITH txs[idx] AS source, txs[idx + 1] AS target
     MERGE (source)-[:${relationship}]->(target)`,
    { edgeLimit: neo4j.int(ATTRIBUTE_EDGE_LIMIT) }
  );
};

const linkSharedAttributes = async (session) => {
  console.log("Linking shared attributes...");
  await linkUserAttribute(session, "email", "SHARED_EMAIL");
  await linkUserAttribute(session, "phone", "SHARED_PHONE");
  await linkUserAttribute(session, "address", "SHARED_ADDRESS");
  await linkUserAttribute(session, "paymentMethod", "SHARED_PAYMENT_METHOD");
  console.log("Shared attributes linked successfully.");
};

const linkRelatedTransactions = async (session) => {
  console.log("Linking related transactions...");
  await linkTransactionAttribute(session, "ip", "SHARED_IP");
  await linkTransactionAttribute(session, "deviceId", "SHARED_DEVICE");
  console.log("Related transactions linked successfully.");
};

const main = async () => {
  try {
    const userCount = parseInt(
      process.env.USER_COUNT || DEFAULT_USER_COUNT,
      10
    );
    const transactionCount = parseInt(
      process.env.TRANSACTION_COUNT || DEFAULT_TRANSACTION_COUNT,
      10
    );

    console.log("Waiting for Neo4j to be ready...");
    const waitResources = [];
    if (process.env.NEO4J_URI?.startsWith("bolt://neo4j")) {
      waitResources.push("tcp:neo4j:7687");
    }
    if (waitResources.length > 0) {
      await waitOn({ resources: waitResources, timeout: 60000 });
    }

    console.log("Generating users and transactions...");
    const users = generateUsers(userCount);
    const transactions = generateTransactions(users, transactionCount);

    console.log(
      `Connecting to Neo4j at ${
        process.env.NEO4J_URI || "bolt://neo4j:7687"
      }...`
    );
    const driver = getNeo4jDriver();
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });

    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    await createUsers(session, users);
    await linkSharedAttributes(session);
    await createTransactions(session, transactions);
    await linkRelatedTransactions(session);

    console.log("✅ Database seeded successfully");

    await session.close();
    await driver.close();
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

main();
