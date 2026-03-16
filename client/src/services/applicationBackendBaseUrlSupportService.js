export function getFrontendApplicationBackendApiBaseUrlTextValue() {
  const configuredBackendApiBaseUrlFromEnvironmentTextValue = String(
    process.env.REACT_APP_BACKEND_BASE_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (configuredBackendApiBaseUrlFromEnvironmentTextValue) {
    return configuredBackendApiBaseUrlFromEnvironmentTextValue;
  }

  if (typeof window !== "undefined") {
    const browserWindowLocationOriginTextValue = String(
      window.location.origin || ""
    )
      .trim()
      .replace(/\/+$/, "");
    const browserWindowLocationHostNameTextValue = String(
      window.location.hostname || ""
    )
      .toLowerCase()
      .trim();

    // I keep localhost fallback so local dev can run without extra env setup.
    if (browserWindowLocationOriginTextValue === "http://localhost:3000") {
      return "http://localhost:3001";
    }

    // I keep Render fallback so app can still call backend when env is missing by mistake.
    // This is not perfect for all names, but it help many deploy case quickly.
    if (browserWindowLocationHostNameTextValue.includes("onrender.com")) {
      return "https://ecommerce-application-backend-api.onrender.com";
    }
  }

  return "http://localhost:3001";
}
