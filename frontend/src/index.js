import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import App from "./App";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  if (window.caches) {
    window.caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.startsWith("empire1-shell") || key.startsWith("lyrica3-shell")) {
          window.caches.delete(key);
        }
      });
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
