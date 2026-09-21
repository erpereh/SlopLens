import { createRoot } from "react-dom/client";

import { OptionsApp } from "./App";
import "@sloplens/ui/styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Options root element not found");
}

createRoot(rootElement).render(<OptionsApp />);
