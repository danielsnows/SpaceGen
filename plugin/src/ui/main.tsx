import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

function showError(message: string) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = "";
    root.style.padding = "24px";
    root.style.fontFamily = "Inter, sans-serif";
    root.style.fontSize = "14px";
    root.style.color = "#e03";
    root.textContent = message;
  }
}

try {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  showError("Erro ao carregar: " + msg);
}
