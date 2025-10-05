import { Link, useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/transactions", label: "Transactions" },
    { to: "/graph", label: "Graph View" },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">
            <Link to="/" className="hover:text-indigo-400 transition">
              User Transaction Graph
            </Link>
          </h1>
          <nav>
            <ul className="flex flex-wrap gap-4 md:gap-6">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== "/" && location.pathname.startsWith(item.to));

                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
