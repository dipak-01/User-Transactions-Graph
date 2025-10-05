import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-100">
      <h1 className="text-6xl font-bold text-slate-100 mb-4">404</h1>
      <p className="text-xl mb-6 text-slate-300">Page not found</p>
      <p className="text-slate-500 mb-8 max-w-xl text-center">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
