import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import LyricaLanding from "./LyricaLanding";
import EmpireHomePage from "./EmpireHomePage";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LyricaLanding />} />
        <Route path="/empire" element={<EmpireHomePage />} />
        <Route path="/app/*" element={<App />} />
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

if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}
