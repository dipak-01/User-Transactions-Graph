import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import GraphView from "./pages/GraphView";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";

function App() {
  const [selectedEntity, setSelectedEntity] = useState(null);

   
  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-grow p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/users"
            element={<Users onEntitySelect={handleEntitySelect} />}
          />
          <Route
            path="/transactions"
            element={<Transactions onEntitySelect={handleEntitySelect} />}
          />
          <Route
            path="/graph"
            element={<GraphView selectedEntity={selectedEntity} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="bg-slate-900 text-slate-400 p-4 text-center">
        <p>
          User and Transactions Relationship Visualization System ©{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
