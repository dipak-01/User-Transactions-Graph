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
const DELETE_BATCH_SIZE = parseInt(process.env.DELETE_BATCH_SIZE || "1000", 10);
const MAX_TRANSACTIONS_PER_USER = parseInt(
  process.env.MAX_TRANSACTIONS_PER_USER || "10",
  10
);
const MAX_COUNTERPARTIES_PER_USER = parseInt(
  process.env.MAX_COUNTERPARTIES_PER_USER || "5",
  10
);

const getNeo4jDriver = () => {
  const uri = process.env.NEO4J_URI || "bolt://neo4j:7687";
  const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || "neo4j";
  const password =
    process.env.NEO4J_PASSWORD || process.env.NEO4J_PASS || "password";

  return neo4j.driver(uri, neo4j.auth.basic(user, password));
};

const generateUsers = (count) => {
  return Array.from({ length: count }).map((_, index) => {
    const id = `user-${index + 1}`;
    const uniqueSuffix = `${index + 1}`;
    return {
      id,
      name: faker.name.findName(),
      email: `${faker.internet
        .userName()
        .replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}.${uniqueSuffix}@${faker.internet.domainName()}`.toLowerCase(),
      phone: `+1-555-${String(index + 1000).padStart(4, "0")}-${String(
        index + 2000
      ).padStart(4, "0")}`,
      address: `${faker.address.streetAddress()} Suite ${uniqueSuffix}`,
      paymentMethod: `${faker.finance.accountName()}-${uniqueSuffix}`,
    };
  });
};

const generateTransactions = (users, desiredCount) => {
  const userIds = users.map((user) => user.id);
  const totalUsers = userIds.length;
  const maxCounterparties = Math.min(
    MAX_COUNTERPARTIES_PER_USER,
    Math.max(0, totalUsers - 1)
  );

  if (totalUsers < 2 || maxCounterparties === 0) {
    return [];
  }

  const devicePool = Array.from({
    length: Math.max(30, Math.floor(users.length * 0.05)),
  }).map((_, idx) => `device-${idx + 1}`);
  const ipPool = Array.from({
    length: Math.max(30, Math.floor(users.length * 0.04)),
  }).map(() => faker.internet.ip());

  let directedPairs = [];

  if (
    maxCounterparties === MAX_COUNTERPARTIES_PER_USER &&
    MAX_COUNTERPARTIES_PER_USER === 5 &&
    totalUsers % 2 === 0
  ) {
    const offsets = [1, 2, totalUsers / 2];
    const uniqueEdges = new Set();

    for (const offset of offsets) {
      for (let i = 0; i < totalUsers; i += 1) {
        const senderId = userIds[i];
        const receiverId = userIds[(i + offset) % totalUsers];
        if (senderId === receiverId) {
          continue;
        }
        const [a, b] =
          senderId < receiverId
            ? [senderId, receiverId]
            : [receiverId, senderId];
        const key = `${a}|${b}`;
        if (uniqueEdges.has(key)) {
          continue;
        }
        uniqueEdges.add(key);
        directedPairs.push([a, b]);
        directedPairs.push([b, a]);
      }
    }
  } else {
    const neighborMap = new Map(userIds.map((id) => [id, new Set()]));
    const remaining = new Set(userIds);

    for (
      let offset = 1;
      remaining.size > 0 && offset < totalUsers;
      offset += 1
    ) {
      let progress = false;

      for (let i = 0; i < totalUsers && remaining.size > 0; i += 1) {
        const senderId = userIds[i];
        const senderNeighbors = neighborMap.get(senderId);
        if (senderNeighbors.size >= maxCounterparties) {
          remaining.delete(senderId);
          continue;
        }

        const receiverIndex = (i + offset) % totalUsers;
        if (receiverIndex === i) {
          continue;
        }

        const receiverId = userIds[receiverIndex];
        const receiverNeighbors = neighborMap.get(receiverId);

        if (receiverNeighbors.size >= maxCounterparties) {
          continue;
        }

        if (senderNeighbors.has(receiverId)) {
          continue;
        }

        senderNeighbors.add(receiverId);
        receiverNeighbors.add(senderId);
        progress = true;

        if (senderNeighbors.size >= maxCounterparties) {
          remaining.delete(senderId);
        }

        if (receiverNeighbors.size >= maxCounterparties) {
          remaining.delete(receiverId);
        }
      }

      if (!progress) {
        break;
      }
    }

    const uniqueEdges = new Set();
    for (const [userId, neighbors] of neighborMap.entries()) {
      for (const neighborId of neighbors) {
        const [a, b] =
          userId < neighborId ? [userId, neighborId] : [neighborId, userId];
        const key = `${a}|${b}`;
        if (uniqueEdges.has(key)) {
          continue;
        }
        uniqueEdges.add(key);
        directedPairs.push([a, b]);
        directedPairs.push([b, a]);
      }
    }

    if (directedPairs.length === 0) {
      console.warn(
        "Unable to generate transaction pairs with current constraints."
      );
      return [];
    }
  }

  const maxPossibleTransactions = Math.floor(
    (userIds.length * MAX_TRANSACTIONS_PER_USER) / 2
  );
  const availableTransactionSlots = directedPairs.length;
  const targetCount = Math.min(
    desiredCount,
    maxPossibleTransactions,
    availableTransactionSlots
  );

  if (targetCount < desiredCount) {
    console.warn(
      `Requested ${desiredCount} transactions but only ${targetCount} can be generated without exceeding per-user limits.`
    );
  }

  const shuffledPairs = faker.helpers
    .shuffle(directedPairs)
    .slice(0, targetCount);

  const transactions = shuffledPairs.map(([senderId, receiverId], index) => ({
    id: `txn-${index + 1}`,
    amount: Number(faker.finance.amount(5, 5000, 2)),
    senderId,
    receiverId,
    ip: faker.random.arrayElement(ipPool),
    deviceId: faker.random.arrayElement(devicePool),
    createdAt:
      Date.now() -
      faker.datatype.number({ min: 0, max: 1000 * 60 * 60 * 24 * 30 }),
  }));

  if (transactions.length % 10000 === 0 && transactions.length > 0) {
    console.log(
      `Generated ${transactions.length} / ${targetCount} transactions...`
    );
  }

  return transactions;
};

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const clearDatabase = async (driver, database) => {
  console.log(
    `Clearing existing data in batches of ${DELETE_BATCH_SIZE} (database: ${database})...`
  );
  let totalDeleted = 0;
  while (true) {
    const session = driver.session({
      database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result = await session.run(
        `MATCH (n)
         WITH n LIMIT $batchSize
         WITH collect(n) AS nodes
         CALL {
           WITH nodes
           UNWIND nodes AS node
           DETACH DELETE node
         }
         RETURN size(nodes) AS deleted`,
        { batchSize: neo4j.int(DELETE_BATCH_SIZE) }
      );

      const deleted = result.records[0]?.get("deleted")?.toNumber?.() || 0;

      totalDeleted += deleted;

      if (totalDeleted > 0 && totalDeleted % (DELETE_BATCH_SIZE * 10) === 0) {
        console.log(`Deleted ${totalDeleted} records so far...`);
      }

      if (deleted === 0) {
        break;
      }
    } finally {
      await session.close();
    }
  }

  console.log(`Cleared ${totalDeleted} nodes and relationships.`);
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
  let processed = 0;
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
    processed += batch.length;
    if (transactions.length >= 5000) {
      console.log(
        `Inserted ${processed} / ${transactions.length} transactions...`
      );
    }
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
    let userCount = parseInt(process.env.USER_COUNT || DEFAULT_USER_COUNT, 10);
    const transactionCount = parseInt(
      process.env.TRANSACTION_COUNT || DEFAULT_TRANSACTION_COUNT,
      10
    );

    if (MAX_TRANSACTIONS_PER_USER <= 0) {
      throw new Error(
        "MAX_TRANSACTIONS_PER_USER must be greater than zero to generate transactions."
      );
    }

    const minimumUsersForTransactions = Math.ceil(
      (2 * transactionCount) / MAX_TRANSACTIONS_PER_USER
    );

    const requiredUserCount = Math.max(2, minimumUsersForTransactions);

    if (userCount < requiredUserCount) {
      console.warn(
        `Requested ${transactionCount} transactions requires at least ${requiredUserCount} users with MAX_TRANSACTIONS_PER_USER=${MAX_TRANSACTIONS_PER_USER}. Adjusting user count from ${userCount} to ${requiredUserCount}.`
      );
      userCount = requiredUserCount;
    }

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
    await driver.verifyConnectivity();
    const database = process.env.NEO4J_DATABASE || "neo4j";
    const session = driver.session({
      database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    await clearDatabase(driver, database);

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
