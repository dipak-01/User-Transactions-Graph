const app = require("../src/app");
const { initializeNeo4jDriver } = require("../src/utils/neo4jDriver");

let driverReady = app.driverInitialization;

async function ensureDriver() {
  if (!driverReady) {
    driverReady = initializeNeo4jDriver().catch((error) => {
      driverReady = null;
      throw error;
    });
  }
  return driverReady;
}

module.exports = async (req, res) => {
  try {
    await ensureDriver();
    return app(req, res);
  } catch (error) {
    console.error("Neo4j initialization failed:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Neo4j initialization failed",
        message: error.message,
      })
    );
  }
};
