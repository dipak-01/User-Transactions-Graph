import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001";


const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


export const getTransactions = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await api.get("/transactions", { params });

     const defaultResponse = {
      data: [],
      pagination: { totalPages: 1, page: 1, limit, totalItems: 0 },
    };

     if (!response.data || typeof response.data !== "object") {
      return defaultResponse;
    }

     return {
      data: Array.isArray(response.data.data) ? response.data.data : [],
      pagination: {
        totalPages: response.data.pagination?.totalPages || 1,
        page: response.data.pagination?.page || page,
        limit: response.data.pagination?.limit || limit,
        totalItems: response.data.pagination?.totalItems || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
     return {
      data: [],
      pagination: { totalPages: 1, page, limit, totalItems: 0 },
    };
  }
};
 
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post("/transactions", transactionData);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

 
export const getTransactionById = async (transactionId) => {
  try {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching transaction ${transactionId}:`, error);
    throw error;
  }
};

 
export const getTransactionRelationships = async (transactionId) => {
  try {
    const response = await api.get(
      `/relationships/transaction/${transactionId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching relationships for transaction ${transactionId}:`,
      error
    );
    throw error;
  }
};
