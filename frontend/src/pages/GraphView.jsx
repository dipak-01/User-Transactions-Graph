import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GraphVisualization from "../components/GraphVisualization";
import { getUserRelationships } from "../services/userService";
import { getTransactionRelationships } from "../services/transactionService";

function GraphView({ selectedEntity }) {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedEntity) {
      
      return;
    }

    loadEntityRelationships(selectedEntity);
  }, [selectedEntity]);

  const loadEntityRelationships = async (entity) => {
    if (!entity || !entity.id) return;

    setLoading(true);
    setError(null);

    try {
      let relationships;

      if (entity.type === "user") {
        relationships = await getUserRelationships(entity.id);
      } else if (entity.type === "transaction") {
        relationships = await getTransactionRelationships(entity.id);
      } else {
        throw new Error("Unknown entity type");
      }

      setGraphData(relationships);
    } catch (err) {
      console.error("Error loading relationships:", err);
      setError("Failed to load relationship data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to go back to dashboard
  const handleBackToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Graph View</h1>
        <button
          onClick={handleBackToDashboard}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          Back to Dashboard
        </button>
      </div>

      {selectedEntity && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg mb-4">
          <h2 className="font-semibold text-slate-100">
            {selectedEntity.type === "user"
              ? `Viewing relationships for user: ${selectedEntity.name}`
              : `Viewing relationships for transaction: $${selectedEntity.amount.toFixed(
                  2
                )}`}
          </h2>
          <p className="text-sm text-slate-400">ID: {selectedEntity.id}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-20 bg-slate-900 border border-slate-800 rounded-lg shadow">
          <div className="loader"></div>
          <span className="ml-2 text-slate-300">Loading graph data...</span>
        </div>
      ) : error ? (
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-lg shadow">
          <div className="text-red-400 text-center">{error}</div>
          <div className="text-center mt-4">
            <button
              onClick={() => loadEntityRelationships(selectedEntity)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <GraphVisualization graphData={graphData} />
      )}
    </div>
  );
}

export default GraphView;
