const { runQuery } = require("../utils/neo4jDriver");

//get all users and transactions for the given user

async function getUserRelationships(userId) {
  const query = `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:DEBIT]->(sent:Transaction)
    OPTIONAL MATCH (sent)<-[:CREDIT]-(sentReceiver:User)
    WITH u, collect(distinct {transaction: sent, counterparty: sentReceiver}) as sentTransactions

    OPTIONAL MATCH (sender:User)-[:DEBIT]->(received:Transaction)<-[:CREDIT]-(u)
    WITH u, sentTransactions, collect(distinct {transaction: received, counterparty: sender}) as receivedTransactions

    OPTIONAL MATCH (u)-[sharedRel:SHARED_ATTRIBUTE]->(otherUser:User)
    WITH u, sentTransactions, receivedTransactions,
      collect(distinct {user: otherUser, relationshipType: type(sharedRel)}) as connectedUsers

    RETURN {
      user: u,
      sentTransactions: sentTransactions,
      receivedTransactions: receivedTransactions,
      connectedUsers: connectedUsers
    } as result
  `;

  const records = await runQuery(query, { userId });

  if (records.length === 0) {
    return { nodes: [], edges: [] };
  }

  const result = records[0].get("result");

  const sentTransactions = (result.sentTransactions || []).filter(
    (entry) => entry && entry.transaction && entry.transaction.properties
  );
  const receivedTransactions = (result.receivedTransactions || []).filter(
    (entry) => entry && entry.transaction && entry.transaction.properties
  );
  const connectedUsers = (result.connectedUsers || []).filter(
    (connection) => connection && connection.user && connection.user.properties
  );

  const nodes = [];
  const edges = [];

  // Add main user node
  const mainUser = result.user.properties;
  nodes.push({
    id: mainUser.id,
    label: mainUser.name,
    type: "user",
    data: mainUser,
  });

  // add sent transaction
  sentTransactions.forEach((entry) => {
    const txn = entry.transaction.properties;
    if (!nodes.some((node) => node.id === txn.id)) {
      nodes.push({
        id: txn.id,
        label: `$${txn.amount}`,
        type: "transaction",
        data: txn,
      });
    }

    edges.push({
      source: mainUser.id,
      target: txn.id,
      label: "SENT",
      type: "sent",
    });

    // add receiver user node and edge
    if (entry.counterparty && entry.counterparty.properties) {
      const receiver = entry.counterparty.properties;
      if (!nodes.some((node) => node.id === receiver.id)) {
        nodes.push({
          id: receiver.id,
          label: receiver.name,
          type: "user",
          data: receiver,
        });
      }

      edges.push({
        source: txn.id,
        target: receiver.id,
        label: "RECEIVED",
        type: "received",
      });
    }
  });

  // add received transaction nodes and edges
  receivedTransactions.forEach((entry) => {
    const txn = entry.transaction.properties;
    if (!nodes.some((node) => node.id === txn.id)) {
      nodes.push({
        id: txn.id,
        label: `$${txn.amount}`,
        type: "transaction",
        data: txn,
      });
    }

    edges.push({
      source: txn.id,
      target: mainUser.id,
      label: "RECEIVED",
      type: "received",
    });

    // add sender user node and edge
    if (entry.counterparty && entry.counterparty.properties) {
      const sender = entry.counterparty.properties;
      if (!nodes.some((node) => node.id === sender.id)) {
        nodes.push({
          id: sender.id,
          label: sender.name,
          type: "user",
          data: sender,
        });
      }

      edges.push({
        source: sender.id,
        target: txn.id,
        label: "SENT",
        type: "sent",
      });
    }
  });

  // add connected users and relationship edges
  connectedUsers.forEach((connection) => {
    const connectedUser = connection.user.properties;
    if (!nodes.some((node) => node.id === connectedUser.id)) {
      nodes.push({
        id: connectedUser.id,
        label: connectedUser.name,
        type: "user",
        data: connectedUser,
      });
    }

    edges.push({
      source: mainUser.id,
      target: connectedUser.id,
      label: connection.relationshipType,
      type: "shared_attribute",
    });
  });

  return {
    nodes,
    edges,
  };
}

// get all linked users and transactions for the given transaction

async function getTransactionRelationships(transactionId) {
  const query = `
    MATCH (t:Transaction {id: $transactionId})
    OPTIONAL MATCH (sender:User)-[:DEBIT]->(t)
    OPTIONAL MATCH (receiver:User)-[:CREDIT]->(t)
    WITH t, sender, receiver

    OPTIONAL MATCH (t)-[:RELATED_TO]-(related:Transaction)
    OPTIONAL MATCH (relatedSender:User)-[:DEBIT]->(related)
    OPTIONAL MATCH (relatedReceiver:User)-[:CREDIT]->(related)
    WITH t, sender, receiver,
      collect(distinct {
        transaction: related,
        sender: relatedSender,
        receiver: relatedReceiver,
        relationshipType: "RELATED_TO"
      }) as connectedTransactions

    RETURN {
      transaction: t,
      sender: sender,
      receiver: receiver,
      connectedTransactions: connectedTransactions
    } as result
  `;

  const records = await runQuery(query, { transactionId });

  if (records.length === 0) {
    return { nodes: [], edges: [] };
  }

  const result = records[0].get("result");

  const nodes = [];
  const edges = [];

  const mainTransaction = result.transaction.properties;
  nodes.push({
    id: mainTransaction.id,
    label: `$${mainTransaction.amount}`,
    type: "transaction",
    data: mainTransaction,
  });

  if (result.sender) {
    const sender = result.sender.properties;
    nodes.push({
      id: sender.id,
      label: sender.name,
      type: "user",
      data: sender,
    });

    edges.push({
      source: sender.id,
      target: mainTransaction.id,
      label: "SENT",
      type: "sent",
    });
  }

  if (result.receiver) {
    const receiver = result.receiver.properties;
    nodes.push({
      id: receiver.id,
      label: receiver.name,
      type: "user",
      data: receiver,
    });

    edges.push({
      source: mainTransaction.id,
      target: receiver.id,
      label: "RECEIVED",
      type: "received",
    });
  }

  const connectedTransactions = (result.connectedTransactions || []).filter(
    (connection) =>
      connection && connection.transaction && connection.transaction.properties
  );

  connectedTransactions.forEach((connection) => {
    const connectedTransaction = connection.transaction.properties;
    if (!nodes.some((node) => node.id === connectedTransaction.id)) {
      nodes.push({
        id: connectedTransaction.id,
        label: `$${connectedTransaction.amount}`,
        type: "transaction",
        data: connectedTransaction,
      });
    }

    edges.push({
      source: mainTransaction.id,
      target: connectedTransaction.id,
      label: connection.relationshipType,
      type: connection.relationshipType,
    });

    if (connection.sender && connection.sender.properties) {
      const sender = connection.sender.properties;
      if (!nodes.some((node) => node.id === sender.id)) {
        nodes.push({
          id: sender.id,
          label: sender.name,
          type: "user",
          data: sender,
        });
      }

      edges.push({
        source: sender.id,
        target: connectedTransaction.id,
        label: "SENT",
        type: "sent",
      });
    }

    if (connection.receiver && connection.receiver.properties) {
      const receiver = connection.receiver.properties;
      if (!nodes.some((node) => node.id === receiver.id)) {
        nodes.push({
          id: receiver.id,
          label: receiver.name,
          type: "user",
          data: receiver,
        });
      }

      edges.push({
        source: connectedTransaction.id,
        target: receiver.id,
        label: "RECEIVED",
        type: "received",
      });
    }
  });

  return {
    nodes,
    edges,
  };
}


module.exports = {
  getUserRelationships,
  getTransactionRelationships,
};
