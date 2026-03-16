const express = require("express");
const passport = require("passport");
const {
  registerUserWithUsernameAndPasswordController,
  loginUserWithUsernameAndPasswordController,
  handleThirdPartyAuthenticationSuccessRedirectController,
  redirectAfterThirdPartyAuthenticationFailureController,
  getCurrentAuthenticatedSessionUserController,
  getAuthenticatedSessionStatusController,
  logoutAuthenticatedSessionUserController
} = require("../controllers/authenticationController");
const {
  isPassportStrategyConfiguredByName
} = require("../config/passportThirdPartyAuthenticationConfiguration");
const {
  requireAuthenticatedSessionUserMiddleware
} = require("../middlewares/requireAuthenticatedSessionUserMiddleware");

const authenticationRouter = express.Router();

// I keep auth route paths in one file to keep server.js clean and easy read.
authenticationRouter.post(
  "/register",
  registerUserWithUsernameAndPasswordController
);
authenticationRouter.post("/login", loginUserWithUsernameAndPasswordController);
authenticationRouter.get(
  "/google",
  ensurePassportThirdPartyStrategyIsConfiguredMiddleware("google"),
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);
authenticationRouter.get(
  "/google/callback",
  ensurePassportThirdPartyStrategyIsConfiguredMiddleware("google"),
  passport.authenticate("google", {
    failureRedirect:
      "/api/auth/oauth/failure?provider=google&oauth_error_code=strategy_authentication_failed"
  }),
  handleThirdPartyAuthenticationSuccessRedirectController
);
authenticationRouter.get(
  "/facebook",
  ensurePassportThirdPartyStrategyIsConfiguredMiddleware("facebook"),
  passport.authenticate("facebook", {
    scope: ["email"]
  })
);
authenticationRouter.get(
  "/facebook/callback",
  ensurePassportThirdPartyStrategyIsConfiguredMiddleware("facebook"),
  passport.authenticate("facebook", {
    failureRedirect:
      "/api/auth/oauth/failure?provider=facebook&oauth_error_code=strategy_authentication_failed"
  }),
  handleThirdPartyAuthenticationSuccessRedirectController
);
authenticationRouter.get(
  "/oauth/failure",
  redirectAfterThirdPartyAuthenticationFailureController
);
authenticationRouter.get(
  "/session-user",
  getCurrentAuthenticatedSessionUserController
);
authenticationRouter.get(
  "/session-status",
  getAuthenticatedSessionStatusController
);
authenticationRouter.post(
  "/logout",
  requireAuthenticatedSessionUserMiddleware,
  logoutAuthenticatedSessionUserController
);

function ensurePassportThirdPartyStrategyIsConfiguredMiddleware(
  strategyNameValue
) {
  return (request, response, next) => {
    // If provider strategy is not configured, I send user back to frontend with clear message.
    if (!isPassportStrategyConfiguredByName(strategyNameValue)) {
      return response.redirect(
        `/api/auth/oauth/failure?provider=${strategyNameValue}&oauth_error_code=provider_not_configured`
      );
    }

    return next();
  };
}

module.exports = {
  authenticationRouter
};
