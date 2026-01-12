import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Computers from "@/pages/Computers";
import ComputerDetails from "@/pages/ComputerDetails";
import Software from "@/pages/Software";
import Monitors from "@/pages/Monitors";
import Printers from "@/pages/Printers";
import Network from "@/pages/Network";
import AgentConfig from "@/pages/AgentConfig";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="computers" element={<Computers />} />
            <Route path="computers/:id" element={<ComputerDetails />} />
            <Route path="software" element={<Software />} />
            <Route path="monitors" element={<Monitors />} />
            <Route path="printers" element={<Printers />} />
            <Route path="network" element={<Network />} />
            <Route path="agent" element={<AgentConfig />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
