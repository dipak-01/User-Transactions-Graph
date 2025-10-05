const transactionService = require("../services/transactionService");

// list of transactions

async function getTransactions(req, res, next) {
  try {
    const pageValue = req.query.page || 1;
    const limitValue = req.query.limit || 10;
    const { minAmount, maxAmount, ip, deviceId, sortField, sortOrder } =
      req.query;

    const page = parseInt(pageValue, 10);
    const limit = parseInt(limitValue, 10);

    const transactions = await transactionService.getTransactions({
      page,
      limit,
      filters: {
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        ip,
        deviceId,
      },
      sort: {
        field: sortField,
        order: sortOrder,
      },
    });

    if (!transactions || !transactions.data) {
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 1,
        },
      });
    }

    res.json(transactions);
  } catch (error) {
    console.error("Error in getTransactions controller:", error);

    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);

    res.json({
      data: [],
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 1,
      },
    });
  }
}

//Create a transaction

async function createTransaction(req, res, next) {
  try {
    const transactionData = req.body;
    const result = await transactionService.createTransaction(transactionData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

//get transaction by id

async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
};
