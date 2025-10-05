const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationshipController");

router.get("/user/:id", relationshipController.getUserRelationships);

router.get(
  "/transaction/:id",
  relationshipController.getTransactionRelationships
);

module.exports = router;
