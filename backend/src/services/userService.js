const neo4j = require("neo4j-driver");
const { runQuery } = require("../utils/neo4jDriver");

//get list of users

async function getUsers({ page = 1, limit = 10, filters = {} }) {
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
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

  query += "RETURN u ORDER BY u.id SKIP $skip LIMIT $limit";

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
