import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:3001");

 
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

 
export const getUsers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await api.get("/users", { params });

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
    console.error("Error fetching users:", error);
     return {
      data: [],
      pagination: { totalPages: 1, page, limit, totalItems: 0 },
    };
  }
};

/**
 * Create or update a user
 */
export const createOrUpdateUser = async (userData) => {
  try {
    const response = await api.post("/users", userData);
    return response.data;
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

 
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

 
export const getUserRelationships = async (userId) => {
  try {
    const response = await api.get(`/relationships/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching relationships for user ${userId}:`, error);
    throw error;
  }
};
