import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GraphVisualization from "../components/GraphVisualization";
import { getFullGraph } from "../services/relationshipService";

function Dashboard() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState(null);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setGraphLoading(true);
    setGraphError(null);

    try {
      const data = await getFullGraph();
      setGraphData(data);
    } catch (error) {
      console.error("Error loading full graph:", error);
      setGraphError("Failed to load the full graph. Please try again.");
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setGraphLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Explore the network of users and transactions. Jump to the dedicated
            tables to filter, search, and open detailed relationship graphs.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/users")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-6 py-4 text-left hover:border-indigo-500 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-medium text-slate-100">
                Users Table
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                View all users in a sortable, filterable table and open their
                relationship graph in one click.
              </p>
            </button>
            <button
              onClick={() => navigate("/transactions")}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-6 py-4 text-left hover:border-indigo-500 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-medium text-slate-100">
                Transactions Table
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Analyze the transaction ledger with filters for amount, device,
                and IP address.
              </p>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">
                Full Network Graph
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Visualize every user, transaction, and shared attribute in one
                view.
              </p>
            </div>
            <button
              onClick={loadGraph}
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 hover:border-indigo-500 hover:text-white transition"
              disabled={graphLoading}
            >
              {graphLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="p-6">
            {graphLoading ? (
              <div className="flex justify-center items-center h-[500px] text-slate-300">
                Loading graph data...
              </div>
            ) : graphError ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-red-400">
                <p>{graphError}</p>
                <button
                  onClick={loadGraph}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                >
                  Try Again
                </button>
              </div>
            ) : graphData && graphData.nodes && graphData.nodes.length > 0 ? (
              <GraphVisualization graphData={graphData} />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-slate-400">
                No graph data available. Try refreshing or seeding the database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
