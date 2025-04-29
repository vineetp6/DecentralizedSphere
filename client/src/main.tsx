import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the database when app starts
import "./lib/database";

createRoot(document.getElementById("root")!).render(<App />);
