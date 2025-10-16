const neo4j = require("neo4j-driver");
const { runQuery } = require("../utils/neo4jDriver");

// get list of transactions

const TRANSACTION_SORT_MAP = {
  id: {
    field: "t.id",
    numericString: {
      regex: "^txn-[0-9]+$",
      numericExpr: "toFloat(replace(%FIELD%, 'txn-', ''))",
    },
  },
  amount: { field: "t.amount" },
  senderid: { field: "t.senderId" },
  receiverid: { field: "t.receiverId" },
  ip: { field: "t.ip" },
  deviceid: { field: "t.deviceId" },
  timestamp: { field: "t.timestamp" },
  createdat: { field: "t.createdAt" },
};

const DEFAULT_TRANSACTION_SORT = TRANSACTION_SORT_MAP.timestamp;

function buildOrderClauses(field, direction, numericString) {
  if (!numericString) {
    return [`${field} ${direction}`];
  }

  const isObject = typeof numericString === "object" && numericString !== null;
  const pattern = isObject && typeof numericString.regex === "string"
    ? numericString.regex
    : "^-?[0-9]+(\\.[0-9]+)?$";
  const template = isObject && typeof numericString.numericExpr === "string"
    ? numericString.numericExpr
    : "toFloat(%FIELD%)";
  const numericExpr = template.replace(/%FIELD%/g, field);

  return [
    `CASE WHEN ${field} =~ '${pattern}' THEN 0 ELSE 1 END ASC`,
    `CASE WHEN ${field} =~ '${pattern}' THEN ${numericExpr} ELSE null END ${direction}`,
    `${field} ${direction}`,
  ];
}

function resolveTransactionSort(sort = {}) {
  if (!sort || typeof sort !== "object") {
    return { ...DEFAULT_TRANSACTION_SORT, direction: "DESC" };
  }

  const rawField = typeof sort.field === "string" ? sort.field.trim() : "";
  const lowerField = rawField.toLowerCase();
  const resolvedField =
    TRANSACTION_SORT_MAP[lowerField] || DEFAULT_TRANSACTION_SORT;

  const rawOrder = typeof sort.order === "string" ? sort.order.trim() : "";
  const direction = rawOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  return { ...resolvedField, direction };
}

async function getTransactions({
  page = 1,
  limit = 10,
  filters = {},
  sort = {},
}) {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const pageInt = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limitInt = Number.isNaN(parsedLimit)
    ? 10
    : Math.min(Math.max(parsedLimit, 1), 10);
  const skip = (pageInt - 1) * limitInt;

  let query = "MATCH (t:Transaction) ";
  let params = {
    skip: neo4j.int(skip),
    limit: neo4j.int(limitInt),
  };

  const whereConditions = [];

  if (filters.minAmount !== undefined) {
    whereConditions.push("t.amount >= $minAmount");
    params.minAmount = filters.minAmount;
  }

  if (filters.maxAmount !== undefined) {
    whereConditions.push("t.amount <= $maxAmount");
    params.maxAmount = filters.maxAmount;
  }

  if (filters.ip) {
    whereConditions.push("t.ip = $ip");
    params.ip = filters.ip;
  }

  if (filters.deviceId) {
    whereConditions.push("t.deviceId = $deviceId");
    params.deviceId = filters.deviceId;
  }

  if (whereConditions.length > 0) {
    query += `WHERE ${whereConditions.join(" AND ")} `;
  }

  const { field: sortField, direction: sortDirection, numericString } =
    resolveTransactionSort(sort);
  const orderClauses = buildOrderClauses(
    sortField,
    sortDirection,
    numericString
  );
  if (sortField !== "t.id") {
    orderClauses.push("t.id ASC");
  }

  query += `RETURN t ORDER BY ${orderClauses.join(
    ", "
  )} SKIP $skip LIMIT $limit`;

  const records = await runQuery(query, params);
  const transactions = records.map((record) => record.get("t").properties);

  const countQuery = `MATCH (t:Transaction) ${
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""
  } RETURN count(t) as total`;
  const countRecords = await runQuery(countQuery, params);
  const totalCount = countRecords[0].get("total").toNumber();

  return {
    data: transactions,
    pagination: {
      page: pageInt,
      limit: limitInt,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limitInt),
    },
  };
}

//  create a transaction
//links sender/receiver users and detect shared IPs/devices between transactions

async function createTransaction(transactionData) {
  const { id, amount, timestamp, ip, deviceId, senderId, receiverId } =
    transactionData;

  const createTransactionQuery = `
    CREATE (t:Transaction {
      id: $id, 
      amount: $amount, 
      timestamp: $timestamp, 
      ip: $ip, 
      deviceId: $deviceId, 
      senderId: $senderId, 
      receiverId: $receiverId,
      createdAt: timestamp()
    })
    RETURN t
  `;

  const transactionRecords = await runQuery(createTransactionQuery, {
    id,
    amount: parseFloat(amount),
    timestamp,
    ip,
    deviceId,
    senderId,
    receiverId,
  });

  const createdTransaction = transactionRecords[0].get("t").properties;

  await createTransactionUserRelationships(id, senderId, receiverId);

  await createSharedTransactionAttributeRelationships(id, ip, deviceId);

  return {
    transaction: createdTransaction,
    message: "Transaction created successfully",
  };
}

//txn by id
async function getTransactionById(id) {
  const query = "MATCH (t:Transaction {id: $id}) RETURN t";
  const records = await runQuery(query, { id });

  if (records.length === 0) {
    return null;
  }

  return records[0].get("t").properties;
}

//  create relationships between txn and users (sender/receiver)

async function createTransactionUserRelationships(
  transactionId,
  senderId,
  receiverId
) {
  const senderQuery = `
    MATCH (u:User {id: $senderId})
    MATCH (t:Transaction {id: $transactionId})
    MERGE (u)-[:SENT]->(t)
  `;
  await runQuery(senderQuery, { senderId, transactionId });

  const receiverQuery = `
    MATCH (u:User {id: $receiverId})
    MATCH (t:Transaction {id: $transactionId})
    MERGE (t)-[:RECEIVED]->(u)
  `;
  await runQuery(receiverQuery, { receiverId, transactionId });
}

// create relationship between txn with shared attributes (IP, device)

async function createSharedTransactionAttributeRelationships(
  transactionId,
  ip,
  deviceId
) {
  if (ip) {
    const ipQuery = `
      MATCH (t1:Transaction {id: $transactionId})
      MATCH (t2:Transaction {ip: $ip})
      WHERE t1.id <> t2.id
      MERGE (t1)-[:SHARED_IP]->(t2)
      RETURN count(*) as relationships
    `;
    await runQuery(ipQuery, { transactionId, ip });
  }

  if (deviceId) {
    const deviceQuery = `
      MATCH (t1:Transaction {id: $transactionId})
      MATCH (t2:Transaction {deviceId: $deviceId})
      WHERE t1.id <> t2.id
      MERGE (t1)-[:SHARED_DEVICE]->(t2)
      RETURN count(*) as relationships
    `;
    await runQuery(deviceQuery, { transactionId, deviceId });
  }
}

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
};
