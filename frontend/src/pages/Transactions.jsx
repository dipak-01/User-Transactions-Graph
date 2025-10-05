import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaFilter, FaPlusCircle, FaSync } from "react-icons/fa";
import Modal from "../components/Modal";
import {
  createTransaction,
  getTransactions,
} from "../services/transactionService";

function Transactions({ onEntitySelect }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minAmount: "",
    maxAmount: "",
    ip: "",
    deviceId: "",
  });
  const defaultTimestamp = () => new Date().toISOString().slice(0, 16);
  const buildEmptyTransaction = () => ({
    id: "",
    amount: "",
    timestamp: defaultTimestamp(),
    ip: "",
    deviceId: "",
    senderId: "",
    receiverId: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingTransaction, setEditingTransaction] = useState(
    buildEmptyTransaction
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  const toDatetimeLocal = (value) => {
    if (!value) {
      return defaultTimestamp();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return defaultTimestamp();
    }

    const offsetDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );
    return offsetDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (overrideFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = {};
      if (overrideFilters.minAmount)
        activeFilters.minAmount = overrideFilters.minAmount;
      if (overrideFilters.maxAmount)
        activeFilters.maxAmount = overrideFilters.maxAmount;
      if (overrideFilters.ip) activeFilters.ip = overrideFilters.ip;
      if (overrideFilters.deviceId)
        activeFilters.deviceId = overrideFilters.deviceId;

      const response = await getTransactions(1, 10, activeFilters);

      setTransactions(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to fetch transactions. Please try again.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadTransactions(filters);
  };

  const clearFilters = () => {
    const cleared = { minAmount: "", maxAmount: "", ip: "", deviceId: "" };
    setFilters(cleared);
    loadTransactions(cleared);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTransaction(buildEmptyTransaction());
    setIsModalOpen(true);
  };

  const openUpdateModal = (transaction) => {
    setModalMode("update");
    setEditingTransaction({
      id: transaction.id || "",
      amount:
        typeof transaction.amount === "number"
          ? transaction.amount.toString()
          : transaction.amount || "",
      timestamp: toDatetimeLocal(transaction.timestamp),
      ip: transaction.ip || "",
      deviceId: transaction.deviceId || "",
      senderId: transaction.senderId || "",
      receiverId: transaction.receiverId || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingTransaction(buildEmptyTransaction());
  };

  const handleTransactionFormChange = (event) => {
    const { name, value } = event.target;
    setEditingTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();

    if (!editingTransaction.id || !editingTransaction.amount) {
      setFormStatus({
        type: "error",
        message: "Transaction ID and amount are required.",
      });
      return;
    }

    if (!editingTransaction.senderId || !editingTransaction.receiverId) {
      setFormStatus({
        type: "error",
        message: "Sender and receiver IDs are required.",
      });
      return;
    }

    const amountValue = Number(editingTransaction.amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setFormStatus({
        type: "error",
        message: "Amount must be a positive number.",
      });
      return;
    }

    const timestampValue = editingTransaction.timestamp
      ? new Date(editingTransaction.timestamp)
      : new Date();

    if (Number.isNaN(timestampValue.getTime())) {
      setFormStatus({
        type: "error",
        message: "Timestamp is invalid. Please pick a valid date and time.",
      });
      return;
    }

    try {
      setFormSubmitting(true);
      const isUpdate = modalMode === "update";
      await createTransaction({
        ...editingTransaction,
        amount: amountValue,
        timestamp: timestampValue.toISOString(),
      });
      await loadTransactions();
      closeModal();
    } catch (err) {
      console.error("Failed to save transaction:", err);
      alert(
        err?.response?.data?.message ||
          "Unable to save transaction. Please review the details and try again."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRowClick = (transaction) => {
    if (onEntitySelect) {
      onEntitySelect({ ...transaction, type: "transaction" });
    }
    navigate("/graph");
  };

  const formatCurrency = (value) => {
    if (typeof value !== "number") {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        return "$0.00";
      }
      return formatCurrency(parsed);
    }

    return value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold">Transactions</h1>
            <p className="text-slate-400 mt-1">
              Inspect the transaction ledger and drill into shared attributes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
            >
              <FaPlusCircle /> Add transaction
            </button>
            <button
              onClick={loadTransactions}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {isModalOpen && (
          <Modal
            title={
              modalMode === "update" ? "Update transaction" : "Add transaction"
            }
            onClose={closeModal}
            footer={
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="transaction-modal-form"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Saving…" : "Save transaction"}
                </button>
              </>
            }
          >
            <form
              id="transaction-modal-form"
              className="space-y-4"
              onSubmit={handleTransactionSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={editingTransaction.id}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="t123"
                    required
                    readOnly={modalMode === "update"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="100.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    name="timestamp"
                    value={editingTransaction.timestamp}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    name="ip"
                    value={editingTransaction.ip}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="192.168.0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Device ID
                  </label>
                  <input
                    type="text"
                    name="deviceId"
                    value={editingTransaction.deviceId}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dev123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Sender User ID
                  </label>
                  <input
                    type="text"
                    name="senderId"
                    value={editingTransaction.senderId}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="u1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Receiver User ID
                  </label>
                  <input
                    type="text"
                    name="receiverId"
                    value={editingTransaction.receiverId}
                    onChange={handleTransactionFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="u2"
                    required
                  />
                </div>
              </div>
            </form>
          </Modal>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-slate-200">
            <FaFilter /> Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                IP Address
              </label>
              <input
                type="text"
                name="ip"
                value={filters.ip}
                onChange={handleFilterChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="192.168.0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Device ID
              </label>
              <input
                type="text"
                name="deviceId"
                value={filters.deviceId}
                onChange={handleFilterChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="dev1"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              disabled={loading}
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              Loading transactions...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Receiver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Device ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      onClick={() => handleRowClick(transaction)}
                      className="cursor-pointer bg-slate-950/60 hover:bg-slate-800 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {transaction.senderId || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {transaction.receiverId || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {transaction.ip || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {transaction.deviceId || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {formatTimestamp(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openUpdateModal(transaction);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 transition"
                        >
                          <FaEdit className="text-slate-300" />
                          <span className="hidden sm:inline">Update</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transactions;
