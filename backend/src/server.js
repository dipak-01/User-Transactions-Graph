require("dotenv").config();
const app = require("./app");
const { closeNeo4jDriver } = require("./utils/neo4jDriver");

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const gracefulShutdown = () => {
  console.log("Shutting down server gracefully...");
  server.close(async () => {
    try {
      await closeNeo4jDriver();
      console.log("Neo4j driver closed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error closing Neo4j driver:", error);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
