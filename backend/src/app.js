require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { initializeNeo4jDriver } = require("./utils/neo4jDriver");

const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const relationshipRoutes = require("./routes/relationshipRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

initializeNeo4jDriver()
  .then(() => console.log("Neo4j driver initialized successfully"))
  .catch((error) => {
    console.error("Failed to initialize Neo4j driver:", error);
    process.exit(1);
  });

app.use("/users", userRoutes);
app.use("/transactions", transactionRoutes);
app.use("/relationships", relationshipRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "User and Transactions Relationship Visualization System API",
    version: "1.0.0",
    endpoints: [
      "/users",
      "/transactions",
      "/relationships/user/:id",
      "/relationships/transaction/:id",
    ],
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Server Error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("Shutting down server gracefully...");
  const { closeNeo4jDriver } = require("./utils/neo4jDriver");
  closeNeo4jDriver()
    .then(() => {
      console.log("Neo4j driver closed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error closing Neo4j driver:", error);
      process.exit(1);
    });
}

module.exports = app;
