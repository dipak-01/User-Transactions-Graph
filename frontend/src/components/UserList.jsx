import { useState, useEffect } from "react";
import { FaUser, FaSearch, FaSync } from "react-icons/fa";
import { getUsers } from "../services/userService";

function UserList({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

   
  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const activeFilters = {};
      if (filters.name) activeFilters.name = filters.name;
      if (filters.email) activeFilters.email = filters.email;
      if (filters.phone) activeFilters.phone = filters.phone;

      const response = await getUsers(page, 10, activeFilters);

       setUsers(Array.isArray(response?.data) ? response.data : []);

       const totalPages =
        typeof response?.pagination?.totalPages === "number"
          ? response.pagination.totalPages
          : 1;

      setTotalPages(totalPages);

       if (!response || !response.data) {
        setError("No user data available. The server may be initializing.");
      }
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
       setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
     if (searchTerm.includes("@")) {
      setFilters({ ...filters, email: searchTerm, name: "", phone: "" });
    } else if (/^\d+$/.test(searchTerm)) {
      setFilters({ ...filters, phone: searchTerm, name: "", email: "" });
    } else {
      setFilters({ ...filters, name: searchTerm, email: "", phone: "" });
    }
    setPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilters({ name: "", email: "", phone: "" });
    setSearchTerm("");
    setPage(1);
    fetchUsers();
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-4 h-full text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={fetchUsers}
          className="text-indigo-400 hover:text-indigo-300 transition"
          title="Refresh"
        >
          <FaSync />
        </button>
      </div>

       
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-500"
            >
              <FaSearch />
            </button>
          </div>
          {(filters.name || filters.email || filters.phone) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-2 px-3 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>
 
        {(filters.name || filters.email || filters.phone) && (
          <div className="mt-2 text-sm text-slate-300">
            <span className="font-semibold text-slate-200">
              Active filters:
            </span>
            {filters.name && (
              <span className="ml-2 bg-indigo-900/40 border border-indigo-700 px-2 py-1 rounded-full">
                {`Name: ${filters.name}`}
              </span>
            )}
            {filters.email && (
              <span className="ml-2 bg-indigo-900/40 border border-indigo-700 px-2 py-1 rounded-full">
                {`Email: ${filters.email}`}
              </span>
            )}
            {filters.phone && (
              <span className="ml-2 bg-indigo-900/40 border border-indigo-700 px-2 py-1 rounded-full">
                {`Phone: ${filters.phone}`}
              </span>
            )}
          </div>
        )}
      </form>

      
      {loading ? (
        <div className="flex justify-center items-center py-10 text-slate-300">
          <div className="loader"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-10">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-slate-300">No users found</div>
      ) : (
        <div className="overflow-y-auto max-h-96">
          <ul className="divide-y divide-slate-800">
            {users.map((user) => (
              <li
                key={user.id}
                className="py-3 px-2 hover:bg-slate-800/70 cursor-pointer transition"
                onClick={() => onUserSelect({ ...user, type: "user" })}
              >
                <div className="flex items-center">
                  <div className="bg-slate-800 rounded-full p-2 mr-3">
                    <FaUser className="text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-100">{user.name}</h3>
                    <p className="text-sm text-slate-300">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
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

export default UserList;
