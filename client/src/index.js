import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globalApplicationStyles.css";

// This is main entry file for frontend app.
// I keep file simple now because later we add router and providers.
const frontendApplicationRootElement = ReactDOM.createRoot(
  document.getElementById("root")
);

frontendApplicationRootElement.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
