const neo4j = require("neo4j-driver");
const { runQuery } = require("../utils/neo4jDriver");

//get list of users

const USER_SORT_MAP = {
  name: { field: "u.name" },
  email: { field: "u.email" },
  phone: { field: "u.phone" },
  address: { field: "u.address" },
  id: { field: "u.id", numericString: true },
  createdAt: { field: "u.createdAt" },
  updatedAt: { field: "u.updatedAt" },
};

const DEFAULT_USER_SORT = USER_SORT_MAP.name;

function resolveUserSort(sort = {}) {
  if (!sort || typeof sort !== "object") {
    return { ...DEFAULT_USER_SORT, direction: "ASC" };
  }

  const rawField = typeof sort.field === "string" ? sort.field.trim() : "";
  const lowerField = rawField.toLowerCase();
  const resolvedField = USER_SORT_MAP[lowerField] || DEFAULT_USER_SORT;

  const rawOrder = typeof sort.order === "string" ? sort.order.trim() : "";
  const direction = rawOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  return { ...resolvedField, direction };
}

async function getUsers({ page = 1, limit = 10, filters = {}, sort = {} }) {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const pageInt = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limitInt = Number.isNaN(parsedLimit)
    ? 10
    : Math.min(Math.max(parsedLimit, 1), 10);
  const skip = (pageInt - 1) * limitInt;

  let query = "MATCH (u:User) ";
  let params = {
    skip: neo4j.int(skip),
    limit: neo4j.int(limitInt),
  };

  const whereConditions = [];
  if (filters.name) {
    whereConditions.push("u.name =~ $namePattern");
    params.namePattern = `(?i).*${filters.name}.*`;
  }

  if (filters.email) {
    whereConditions.push("u.email =~ $emailPattern");
    params.emailPattern = `(?i).*${filters.email}.*`;
  }

  if (filters.phone) {
    whereConditions.push("u.phone =~ $phonePattern");
    params.phonePattern = `(?i).*${filters.phone}.*`;
  }

  if (whereConditions.length > 0) {
    query += `WHERE ${whereConditions.join(" AND ")} `;
  }

  const { field: sortField, direction: sortDirection, numericString } =
    resolveUserSort(sort);

  const orderClauses = [];
  if (numericString) {
    const numericRegex = "^-?[0-9]+(\\.[0-9]+)?$";
    orderClauses.push(
      `CASE WHEN ${sortField} =~ '${numericRegex}' THEN 0 ELSE 1 END ASC`
    );
    orderClauses.push(
      `CASE WHEN ${sortField} =~ '${numericRegex}' THEN toFloat(${sortField}) ELSE null END ${sortDirection}`
    );
    orderClauses.push(`${sortField} ${sortDirection}`);
  } else {
    orderClauses.push(`${sortField} ${sortDirection}`);
  }
  if (sortField !== "u.id") {
    orderClauses.push("u.id ASC");
  }

  query += `RETURN u ORDER BY ${orderClauses.join(
    ", "
  )} SKIP $skip LIMIT $limit`;

  const records = await runQuery(query, params);
  const users = records.map((record) => record.get("u").properties);

  const countQuery = `MATCH (u:User) ${
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""
  } RETURN count(u) as total`;
  const countRecords = await runQuery(countQuery, params);
  const totalCount = countRecords[0].get("total").toNumber();

  return {
    data: users,
    pagination: {
      page: pageInt,
      limit: limitInt,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limitInt),
    },
  };
}

//create or update a user
// auto detect shared attributes and create relationships

async function createOrUpdateUser(userData) {
  const { id, name, email, phone, address, paymentMethod } = userData;

  const createUserQuery = `
    MERGE (u:User {id: $id})
    ON CREATE SET u.name = $name, u.email = $email, u.phone = $phone, u.address = $address, u.paymentMethod = $paymentMethod, u.createdAt = timestamp()
    ON MATCH SET u.name = $name, u.email = $email, u.phone = $phone, u.address = $address, u.paymentMethod = $paymentMethod, u.updatedAt = timestamp()
    RETURN u
  `;

  const userRecords = await runQuery(createUserQuery, {
    id,
    name,
    email,
    phone,
    address,
    paymentMethod,
  });

  const createdUser = userRecords[0].get("u").properties;

  await createSharedAttributeRelationships(
    id,
    email,
    phone,
    address,
    paymentMethod
  );

  return {
    user: createdUser,
    message: "User created or updated successfully",
  };
}

//user by id
async function getUserById(id) {
  const query = "MATCH (u:User {id: $id}) RETURN u";
  const records = await runQuery(query, { id });

  if (records.length === 0) {
    return null;
  }

  return records[0].get("u").properties;
}

//relation betwn user and shared attributes
async function createSharedAttributeRelationships(
  userId,
  email,
  phone,
  address,
  paymentMethod
) {
  if (email) {
    const emailQuery = `
      MATCH (u1:User {id: $userId})
      MATCH (u2:User {email: $email})
      WHERE u1.id <> u2.id
      MERGE (u1)-[:SHARED_EMAIL]->(u2)
      RETURN count(*) as relationships
    `;
    await runQuery(emailQuery, { userId, email });
  }

  if (phone) {
    const phoneQuery = `
      MATCH (u1:User {id: $userId})
      MATCH (u2:User {phone: $phone})
      WHERE u1.id <> u2.id
      MERGE (u1)-[:SHARED_PHONE]->(u2)
      RETURN count(*) as relationships
    `;
    await runQuery(phoneQuery, { userId, phone });
  }

  if (address) {
    const addressQuery = `
      MATCH (u1:User {id: $userId})
      MATCH (u2:User {address: $address})
      WHERE u1.id <> u2.id
      MERGE (u1)-[:SHARED_ADDRESS]->(u2)
      RETURN count(*) as relationships
    `;
    await runQuery(addressQuery, { userId, address });
  }

  if (paymentMethod) {
    const paymentMethodQuery = `
      MATCH (u1:User {id: $userId})
      MATCH (u2:User {paymentMethod: $paymentMethod})
      WHERE u1.id <> u2.id
      MERGE (u1)-[:SHARED_PAYMENT_METHOD]->(u2)
      RETURN count(*) as relationships
    `;
    await runQuery(paymentMethodQuery, { userId, paymentMethod });
  }
}

module.exports = {
  getUsers,
  createOrUpdateUser,
  getUserById,
};
