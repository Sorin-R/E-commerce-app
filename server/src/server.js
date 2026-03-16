const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const passport = require("passport");
const { authenticationRouter } = require("./routes/authenticationRoutes");
const { productCatalogRouter } = require("./routes/productCatalogRoutes");
const { shoppingCartRouter } = require("./routes/shoppingCartRoutes");
const { checkoutPaymentRouter } = require("./routes/checkoutPaymentRoutes");
const {
  configurePassportThirdPartyAuthenticationStrategies
} = require("./config/passportThirdPartyAuthenticationConfiguration");

dotenv.config();

const backendApplicationServer = express();
const backendApplicationServerPortValue = process.env.PORT || 3001;
const frontendApplicationUrlListTextValue =
  process.env.FRONTEND_APPLICATION_URL || "";
const allowedFrontendCorsOriginTextListValue =
  frontendApplicationUrlListTextValue
    .split(",")
    .map((allowedFrontendCorsOriginTextValue) =>
      normalizeCorsOriginTextValue(allowedFrontendCorsOriginTextValue)
    )
    .filter(Boolean);
const sessionCookieNameValue =
  process.env.SESSION_COOKIE_NAME ||
  "ecommerce_application_session_id_cookie_value";
const sessionCookieMaxAgeInMillisecondsValue =
  Number(process.env.SESSION_COOKIE_MAX_AGE_IN_MILLISECONDS) ||
  1000 * 60 * 60 * 24;
const normalizedSessionCookieSameSitePolicyTextValue =
  buildNormalizedSessionCookieSameSitePolicyTextValue(
    process.env.SESSION_COOKIE_SAME_SITE || "lax"
  );
const isSessionCookieSecureEnabledValue =
  process.env.SESSION_COOKIE_SECURE === "true" ||
  (process.env.SESSION_COOKIE_SECURE !== "false" &&
    process.env.NODE_ENV === "production");

// On Render, proxy headers are needed so secure cookies can work correctly in production.
backendApplicationServer.set("trust proxy", 1);

// CORS allow frontend url so browser can send cookies for session login.
backendApplicationServer.use(
  cors({
    origin: (
      requestOriginValue,
      corsOriginValidationDoneCallbackFunctionValue
    ) => {
      // I allow requests that do not send origin (health checks, curl, server-to-server).
      if (!requestOriginValue) {
        corsOriginValidationDoneCallbackFunctionValue(null, true);
        return;
      }

      const normalizedRequestOriginTextValue =
        normalizeCorsOriginTextValue(requestOriginValue);
      const isRequestOriginAllowedByConfiguredCorsOriginListValue =
        !allowedFrontendCorsOriginTextListValue.length ||
        allowedFrontendCorsOriginTextListValue.includes(
          normalizedRequestOriginTextValue
        );

      if (isRequestOriginAllowedByConfiguredCorsOriginListValue) {
        corsOriginValidationDoneCallbackFunctionValue(null, true);
        return;
      }

      console.warn(
        `Blocked CORS origin: ${requestOriginValue}. Allowed list: ${allowedFrontendCorsOriginTextListValue.join(", ")}`
      );
      corsOriginValidationDoneCallbackFunctionValue(
        new Error("Request origin is not allowed by backend CORS policy.")
      );
    },
    credentials: true
  })
);

backendApplicationServer.use(express.json());

// Session is needed so user login state can stay after request finish.
backendApplicationServer.use(
  session({
    name: sessionCookieNameValue,
    secret: process.env.SESSION_SECRET || "development_session_secret_change_me",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    unset: "destroy",
    cookie: {
      secure: isSessionCookieSecureEnabledValue,
      httpOnly: true,
      sameSite: normalizedSessionCookieSameSitePolicyTextValue,
      maxAge: sessionCookieMaxAgeInMillisecondsValue
    }
  })
);

// Passport need session middleware first, then initialize and session handlers.
configurePassportThirdPartyAuthenticationStrategies();
backendApplicationServer.use(passport.initialize());
backendApplicationServer.use(passport.session());

// Health endpoint help us test backend is alive.
backendApplicationServer.get("/api/health", (request, response) => {
  response.status(200).json({
    message: "Backend is running."
  });
});

backendApplicationServer.use("/api/auth", authenticationRouter);
backendApplicationServer.use("/api/products", productCatalogRouter);
backendApplicationServer.use("/api/cart", shoppingCartRouter);
backendApplicationServer.use("/api/checkout", checkoutPaymentRouter);

backendApplicationServer.listen(backendApplicationServerPortValue, () => {
  console.log(
    `Backend server is running on port ${backendApplicationServerPortValue}`
  );
});

function buildNormalizedSessionCookieSameSitePolicyTextValue(
  sessionCookieSameSitePolicyTextValue
) {
  const normalizedSessionCookieSameSitePolicyTextValue = String(
    sessionCookieSameSitePolicyTextValue || "lax"
  )
    .toLowerCase()
    .trim();

  if (
    normalizedSessionCookieSameSitePolicyTextValue === "none" ||
    normalizedSessionCookieSameSitePolicyTextValue === "strict"
  ) {
    return normalizedSessionCookieSameSitePolicyTextValue;
  }

  return "lax";
}

function normalizeCorsOriginTextValue(corsOriginTextValue) {
  const normalizedCorsOriginTextValue = String(corsOriginTextValue || "")
    .trim()
    .replace(/\/+$/, "");

  if (!normalizedCorsOriginTextValue) {
    return "";
  }

  try {
    const corsOriginUrlObjectValue = new URL(normalizedCorsOriginTextValue);
    return `${corsOriginUrlObjectValue.protocol}//${corsOriginUrlObjectValue.host}`
      .toLowerCase()
      .trim();
  } catch {
    return normalizedCorsOriginTextValue.toLowerCase().trim();
  }
}
