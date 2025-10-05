import { useState, useEffect } from "react";
import { FaCreditCard, FaSearch, FaSync } from "react-icons/fa";
import { getTransactions } from "../services/transactionService";

function TransactionList({ onTransactionSelect }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    minAmount: "",
    maxAmount: "",
    ip: "",
    deviceId: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = {};
      if (filters.minAmount) activeFilters.minAmount = filters.minAmount;
      if (filters.maxAmount) activeFilters.maxAmount = filters.maxAmount;
      if (filters.ip) activeFilters.ip = filters.ip;
      if (filters.deviceId) activeFilters.deviceId = filters.deviceId;

      const response = await getTransactions(page, 10, activeFilters);

       setTransactions(Array.isArray(response?.data) ? response.data : []);

       const totalPages =
        typeof response?.pagination?.totalPages === "number"
          ? response.pagination.totalPages
          : 1;

      setTotalPages(totalPages);

       if (!response || !response.data) {
        setError(
          "No transaction data available. The server may be initializing."
        );
      }
    } catch (err) {
      setError("Failed to fetch transactions. Please try again.");
      console.error("Error fetching transactions:", err);
       setTransactions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      minAmount: "",
      maxAmount: "",
      ip: "",
      deviceId: "",
    });
    setPage(1);
    fetchTransactions();
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

   const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-4 h-full text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transactions</h2>
        <button
          onClick={fetchTransactions}
          className="text-indigo-400 hover:text-indigo-300 transition"
          title="Refresh"
        >
          <FaSync />
        </button>
      </div>

       
      <form onSubmit={handleSearch} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Min Amount
            </label>
            <input
              type="number"
              name="minAmount"
              placeholder="Min amount..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
              value={filters.minAmount}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Max Amount
            </label>
            <input
              type="number"
              name="maxAmount"
              placeholder="Max amount..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
              value={filters.maxAmount}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              IP Address
            </label>
            <input
              type="text"
              name="ip"
              placeholder="IP address..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
              value={filters.ip}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Device ID
            </label>
            <input
              type="text"
              name="deviceId"
              placeholder="Device ID..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
              value={filters.deviceId}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="flex mt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center transition"
          >
            <FaSearch className="mr-1" />
            Search
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="ml-2 px-4 py-2 bg-slate-800 text-slate-200 rounded hover:bg-slate-700"
          >
            Clear
          </button>
        </div>
      </form>

     
      {loading ? (
        <div className="flex justify-center items-center py-10 text-slate-300">
          <div className="loader"></div>
          <span className="ml-2">Loading transactions...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-10">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-slate-300">
          No transactions found
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96">
          <ul className="divide-y divide-slate-800">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="py-3 px-2 hover:bg-slate-800/70 cursor-pointer transition"
                onClick={() =>
                  onTransactionSelect({ ...transaction, type: "transaction" })
                }
              >
                <div className="flex items-center">
                  <div className="bg-slate-800 rounded-full p-2 mr-3">
                    <FaCreditCard className="text-slate-300" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        ${transaction.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(transaction.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-slate-400">From: </span>
                      <span>{transaction.senderId}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-slate-400">To: </span>
                      <span>{transaction.receiverId}</span>
                    </p>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>IP: {transaction.ip}</span>
                      <span>Device: {transaction.deviceId}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

    
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded border ${
              page === 1
                ? "bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed"
                : "bg-slate-950 text-slate-100 border-slate-700 hover:bg-slate-800"
            }`}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded border ${
              page === totalPages
                ? "bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed"
                : "bg-slate-950 text-slate-100 border-slate-700 hover:bg-slate-800"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionList;
