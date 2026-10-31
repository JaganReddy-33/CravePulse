import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import App from "./App.jsx";

try {
  Object.keys(localStorage)
    .filter(
      (key) =>
        key.startsWith("cravepulse_") ||
        ["accessToken", "refreshToken", "user", "cart"].includes(key),
    )
    .forEach((key) => localStorage.removeItem(key));
} catch {
  /* storage may be unavailable; it is not needed */
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
