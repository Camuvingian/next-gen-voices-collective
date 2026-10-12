import { createRoot } from "react-dom/client";
import App from "./App";

// restore the reviewer's neon colour choice (palette dock); default is neon red
try {
  const hl = localStorage.getItem("ng-hl");
  if (hl && ["ruby", "white", "blue", "pink", "violet"].includes(hl)) document.documentElement.dataset.ngHl = hl;
} catch {
  /* storage blocked: default colour */
}

createRoot(document.getElementById("root")!).render(<App />);
