const relationshipService = require("../services/relationshipService");

// connected users and transactions for a given user

async function getUserRelationships(req, res, next) {
  try {
    const { id } = req.params;
    const relationships = await relationshipService.getUserRelationships(id);
    res.json(relationships);
  } catch (error) {
    next(error);
  }
}

// all users and transactions for a transaction

async function getTransactionRelationships(req, res, next) {
  try {
    const { id } = req.params;
    const relationships = await relationshipService.getTransactionRelationships(
      id
    );
    res.json(relationships);
  } catch (error) {
    next(error);
  }
}

async function getFullGraph(req, res, next) {
  try {
    const graph = await relationshipService.getFullGraph();
    res.json(graph);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserRelationships,
  getTransactionRelationships,
  getFullGraph,
};
