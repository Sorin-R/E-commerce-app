import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ApplicationAuthenticationSessionContextProvider } from "./context/ApplicationAuthenticationSessionContextProvider";
import { ApplicationShoppingCartTrackingContextProvider } from "./context/ApplicationShoppingCartTrackingContextProvider";
import "./styles/globalApplicationStyles.css";

// This is frontend start point file, React app render from here.
// BrowserRouter wrapper is important so all route page can work correct.
const frontendApplicationRootElement = ReactDOM.createRoot(
  document.getElementById("root")
);

frontendApplicationRootElement.render(
  <React.StrictMode>
    <ApplicationAuthenticationSessionContextProvider>
      <ApplicationShoppingCartTrackingContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApplicationShoppingCartTrackingContextProvider>
    </ApplicationAuthenticationSessionContextProvider>
  </React.StrictMode>
);
