import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaFilter, FaSync, FaTimes, FaUserPlus } from "react-icons/fa";
import Modal from "../components/Modal";
import { createOrUpdateUser, getUsers } from "../services/userService";

function Users({ onEntitySelect }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ITEMS_PER_PAGE = 10;
  const DEFAULT_PAGINATION = useMemo(
    () => ({ page: 1, totalPages: 1, totalItems: 0, limit: ITEMS_PER_PAGE }),
    [ITEMS_PER_PAGE]
  );
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const filterDefaults = useMemo(
    () => ({ name: "", email: "", phone: "" }),
    []
  );
  const [filters, setFilters] = useState(() => ({ ...filterDefaults }));
  const [activeFilters, setActiveFilters] = useState(() => ({}));
  const emptyUser = {
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "",
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingUser, setEditingUser] = useState(emptyUser);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const sanitizeFilters = (rawFilters = {}) => {
    return Object.entries(rawFilters).reduce((acc, [key, value]) => {
      const trimmed = (value ?? "").toString().trim();
      if (trimmed) {
        acc[key] = trimmed;
      }
      return acc;
    }, {});
  };

  const areFiltersEqual = (a = {}, b = {}) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => a[key] === b[key]);
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  const loadUsers = async (page = 1, filtersOverride = activeFilters) => {
    setLoading(true);
    setError(null);

    const sanitizedFilters = sanitizeFilters(filtersOverride);

    try {
      setActiveFilters((prev) =>
        areFiltersEqual(prev, sanitizedFilters) ? prev : sanitizedFilters
      );

      const response = await getUsers(page, ITEMS_PER_PAGE, sanitizedFilters);

      setUsers(Array.isArray(response?.data) ? response.data : []);
      setPagination(
        response?.pagination && typeof response.pagination === "object"
          ? {
              page: response.pagination.page || page,
              totalPages: response.pagination.totalPages || 1,
              totalItems: response.pagination.totalItems || 0,
              limit: response.pagination.limit || ITEMS_PER_PAGE,
            }
          : { ...DEFAULT_PAGINATION, page }
      );
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
      setUsers([]);
      setPagination({ ...DEFAULT_PAGINATION, page });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterInputChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    const sanitized = sanitizeFilters(filters);
    setActiveFilters((prev) =>
      areFiltersEqual(prev, sanitized) ? prev : sanitized
    );
    await loadUsers(1, sanitized);
  };

  const handleFilterReset = async () => {
    const resetFilters = { ...filterDefaults };
    setFilters(resetFilters);
    setActiveFilters({});
    await loadUsers(1, {});
  };

  const isFilterDirty = useMemo(
    () =>
      Object.values(filters).some((value) => value && value.toString().trim()),
    [filters]
  );

  const hasActiveFilters = useMemo(
    () => Object.keys(activeFilters).length > 0,
    [activeFilters]
  );

  const handlePageChange = (nextPage) => {
    const targetPage = Math.min(
      Math.max(nextPage, 1),
      Math.max(pagination.totalPages, 1)
    );

    if (targetPage === pagination.page) {
      return;
    }

    loadUsers(targetPage);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingUser(emptyUser);
    setIsModalOpen(true);
  };

  const openUpdateModal = (user) => {
    setModalMode("update");
    setEditingUser({
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      paymentMethod: user.paymentMethod || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(emptyUser);
    setModalMode("create");
  };

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFormSubmit = async (event) => {
    event.preventDefault();

    if (!editingUser.id || !editingUser.name || !editingUser.email) {
      alert("ID, name, and email are required.");
      return;
    }

    try {
      setFormSubmitting(true);
      await createOrUpdateUser(editingUser);
      closeModal();
      await loadUsers(pagination.page || 1);
    } catch (err) {
      console.error("Failed to save user:", err);
      alert(
        err?.response?.data?.message ||
          "Unable to save user. Please check the details and try again."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRowClick = (user) => {
    if (onEntitySelect) {
      onEntitySelect({ ...user, type: "user" });
    }
    navigate("/graph");
  };
  return (
    <div className="min-h-[calc(100vh-160px)] bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold">Users</h1>
            <p className="text-slate-400 mt-1">
              Browse all users and drill into their relationships.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
            >
              <FaUserPlus /> Add user
            </button>
            <button
              onClick={() => loadUsers(pagination.page || 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {isModalOpen && (
          <Modal
            title={modalMode === "update" ? "Update user" : "Add user"}
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
                  form="user-modal-form"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "Saving…" : "Save user"}
                </button>
              </>
            }
          >
            <form
              id="user-modal-form"
              className="space-y-4"
              onSubmit={handleUserFormSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={editingUser.id}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="u123"
                    required
                    readOnly={modalMode === "update"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="jane@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editingUser.phone}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingUser.address}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Payment method
                  </label>
                  <input
                    type="text"
                    name="paymentMethod"
                    value={editingUser.paymentMethod}
                    onChange={handleUserFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Visa **** 4242"
                  />
                </div>
              </div>
            </form>
          </Modal>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <form
            onSubmit={handleFilterSubmit}
            className="border-b border-slate-800 bg-slate-900/80 px-6 py-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterInputChange}
                  placeholder="Search by name"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={filters.email}
                  onChange={handleFilterInputChange}
                  placeholder="Search by email"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={filters.phone}
                  onChange={handleFilterInputChange}
                  placeholder="Search by phone"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!isFilterDirty && !hasActiveFilters}
                >
                  <FaFilter />
                  Apply filters
                </button>
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isFilterDirty && !hasActiveFilters}
                >
                  <FaTimes />
                  Clear
                </button>
              </div>
            </div>
            {hasActiveFilters && (
              <p className="mt-3 text-xs text-indigo-300">
                Showing results for active filters.
              </p>
            )}
          </form>
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              Loading users...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleRowClick(user)}
                      className="cursor-pointer bg-slate-950/60 hover:bg-slate-800 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openUpdateModal(user);
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="text-sm text-slate-400">
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                  {typeof pagination.totalItems === "number" &&
                    pagination.totalItems >= 0 && (
                      <span className="ml-2">
                        · {pagination.totalItems} users total
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange((pagination.page || 1) - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange((pagination.page || 1) + 1)}
                    disabled={
                      pagination.page >= pagination.totalPages ||
                      pagination.totalPages <= 1
                    }
                    className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
