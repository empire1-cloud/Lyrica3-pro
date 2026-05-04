import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import LyricaLanding from "./LyricaLanding";
import EmpireHomePage from "./EmpireHomePage";
import SLA113App from "./sla113/SLA113App";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing pages */}
        <Route path="/" element={<LyricaLanding />} />
        <Route path="/empire" element={<EmpireHomePage />} />

        {/* SLA-113 Admin OS — login-gated */}
        <Route path="/sla113/*" element={<SLA113App />} />

        {/* Authenticated studio — all sub-routes handled inside App */}
        <Route path="/app/*" element={<App />} />

        {/* Fallback: unknown paths → studio */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);

// PWA — register service worker (production only)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => {});
  });
}
