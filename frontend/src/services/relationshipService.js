import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getFullGraph = async () => {
  try {
    const response = await api.get("/relationships/graph");
    if (!response || typeof response.data !== "object") {
      return { nodes: [], edges: [] };
    }
    const nodes = Array.isArray(response.data.nodes) ? response.data.nodes : [];
    const edges = Array.isArray(response.data.edges) ? response.data.edges : [];
    return { nodes, edges };
  } catch (error) {
    console.error("Error fetching full graph:", error);
    return { nodes: [], edges: [] };
  }
};
