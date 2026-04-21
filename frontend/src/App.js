import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import StemDeck from "./pages/StemDeck";
import FlipFeed from "./pages/FlipFeed";
import MutationEngine from "./pages/MutationEngine";
import UniversalStream from "./pages/UniversalStream";
import DuetEngine from "./pages/DuetEngine";

function Protected({ children }) {
  const { user, loading, token } = useAuth();
  if (loading) return <div className="p-12 font-mono text-[#8a8278]">Priming Empire 1 Ledger…</div>;
  if (!token || !user) return <Navigate to="/login" replace/>;
  return <Shell>{children}</Shell>;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"     element={<Login/>}/>
            <Route path="/deck"      element={<Protected><StemDeck/></Protected>}/>
            <Route path="/feed"      element={<Protected><FlipFeed/></Protected>}/>
            <Route path="/ignite"    element={<Protected><MutationEngine/></Protected>}/>
            <Route path="/duet"      element={<Protected><DuetEngine/></Protected>}/>
            <Route path="/universal" element={<Protected><UniversalStream/></Protected>}/>
            <Route path="/"          element={<Navigate to="/deck" replace/>}/>
            <Route path="*"          element={<Navigate to="/deck" replace/>}/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
