const neo4j = require("neo4j-driver");

let driver = null;

//initilise the Neo4j driver  
  
async function initializeNeo4jDriver() {
  try {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

     
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hr
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 min
    });

     
    await driver.verifyConnectivity();

    return driver;
  } catch (error) {
    console.error("Neo4j Driver Initialization Error:", error);
    throw error;
  }
}

 
function getNeo4jDriver() {
  if (!driver) {
    throw new Error(
      "Neo4j driver not initialized. Call initializeNeo4jDriver first."
    );
  }
  return driver;
}

 
async function closeNeo4jDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

 
function getSession(database = process.env.NEO4J_DATABASE) {
  if (!driver) {
    throw new Error(
      "Neo4j driver not initialized. Call initializeNeo4jDriver first."
    );
  }
  return driver.session({ database });
}

/**
 * Run a Neo4j query
 * @param {string} query - Cypher query
 * @param {Object} params - Query parameters
 */

async function runQuery(query, params = {}) {
  const session = getSession();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

module.exports = {
  initializeNeo4jDriver,
  getNeo4jDriver,
  closeNeo4jDriver,
  getSession,
  runQuery,
};
