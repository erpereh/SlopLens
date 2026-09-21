import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./host.css";
import "@sloplens/ui/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Harness root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
