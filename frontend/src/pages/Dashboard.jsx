import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaExchangeAlt,
  FaProjectDiagram,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-160px)] bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 p-8 sm:p-12 shadow-2xl">
          <div className="lg:flex lg:items-center lg:justify-between gap-12">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/50 bg-indigo-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                Fraud ops command center
              </p>
              <h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-tight">
                Understand suspicious networks before the damage is done.
              </h1>
              <p className="mt-4 text-lg text-slate-300">
                Start from curated tables, pivot into relationship graphs, and
                surface risky clusters in minutes. Your 20k users and 100k
                transactions are already indexed—pick where to investigate next.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/users")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-500"
                >
                  Browse users
                  <FaArrowRight className="text-sm" />
                </button>
                <button
                  onClick={() => navigate("/transactions")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-indigo-500 hover:text-white"
                >
                  Review transactions
                </button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/80">
                    <FaUsers />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-white">20k</p>
                  <p className="text-xs uppercase tracking-wide text-indigo-100">
                    Users mapped
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                    <FaExchangeAlt />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-white">100k</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Transactions traced
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-5 text-left">
                  <div className="flex items-center gap-3 text-indigo-200">
                    <FaShieldAlt className="text-lg" />
                    <span className="text-sm uppercase tracking-wide">
                      What’s next?
                    </span>
                  </div>
                  <p className="mt-3 text-slate-300 text-sm">
                    Filter tables to isolate cohorts, then open a user to view
                    their mini-network in Graph View for focused, purposeful
                    investigations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/80 text-white">
                <FaUsers />
              </span>
              Users workspace
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Slice the directory by name, email, or device patterns. When you
              find a risky account, jump straight into their immediate
              connections.
            </p>
            <button
              onClick={() => navigate("/users")}
              className="mt-4 inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200"
            >
              Open users
              <FaArrowRight className="text-xs" />
            </button>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-indigo-200">
                <FaExchangeAlt />
              </span>
              Transactions explorer
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Investigate transfers by amount range, device, or IP. Spot spiky
              behavior and correlate with known mule accounts.
            </p>
            <button
              onClick={() => navigate("/transactions")}
              className="mt-4 inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200"
            >
              Open transactions
              <FaArrowRight className="text-xs" />
            </button>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-200">
                <FaProjectDiagram />
              </span>
              Graph view briefing
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Launch the graph when you’re ready to map relationships for a
              specific entity. It’s optimized for focused exploration rather
              than loading the entire network at once.
            </p>
            <button
              onClick={() => navigate("/graph")}
              className="mt-4 inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200"
            >
              Go to graph view
              <FaArrowRight className="text-xs" />
            </button>
          </article>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
