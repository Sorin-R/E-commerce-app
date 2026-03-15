const bcrypt = require("bcryptjs");
const {
  postgresDatabasePoolConnection
} = require("../database/postgresDatabasePoolConnection");
const {
  regenerateSessionStorePromise,
  loginUserIntoPassportSessionPromise,
  saveAuthenticatedUserPayloadIntoSessionStore,
  destroySessionStorePromise
} = require("../helpers/authenticatedSessionSupportHelper");

async function loginUserWithUsernameAndPasswordController(request, response) {
  // I read login input from request body sent by frontend.
  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).json({
      message: "Username and password are required."
    });
  }

  try {
    // I search one user by username to get stored password hash from database.
    const userSearchQueryResult = await postgresDatabasePoolConnection.query(
      `
        SELECT id, username, password_hash
        FROM users
        WHERE username = $1
        LIMIT 1
      `,
      [username]
    );

    if (userSearchQueryResult.rowCount === 0) {
      return response.status(401).json({
        message: "Invalid username or password."
      });
    }

    const foundUserRecordData = userSearchQueryResult.rows[0];

    if (!foundUserRecordData.password_hash) {
      return response.status(401).json({
        message:
          "This account use third-party login. Please login with Google or Facebook button."
      });
    }

    // Important: we do not hash manually here, bcrypt.compare do secure check with salt.
    const isPasswordMatchingStoredHashResult = await bcrypt.compare(
      password,
      foundUserRecordData.password_hash
    );

    if (!isPasswordMatchingStoredHashResult) {
      return response.status(401).json({
        message: "Invalid username or password."
      });
    }

    const authenticatedUserSessionPayloadObject = {
      id: foundUserRecordData.id,
      username: foundUserRecordData.username,
      authProvider: "local",
      emailAddress: null
    };

    // I create fresh session id before login save, this is better for security.
    await regenerateSessionStorePromise(request);

    // I also use passport login helper so user session can work for all auth methods.
    await loginUserIntoPassportSessionPromise(
      request,
      authenticatedUserSessionPayloadObject
    );
    saveAuthenticatedUserPayloadIntoSessionStore(
      request,
      authenticatedUserSessionPayloadObject
    );

    return response.status(200).json({
      message: "Login successful.",
      user: authenticatedUserSessionPayloadObject
    });
  } catch (error) {
    console.error("Login endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying login."
    });
  }
}

async function handleThirdPartyAuthenticationSuccessRedirectController(
  request,
  response
) {
  try {
    const authenticatedSessionUserPayloadObject = request.user;

    if (!authenticatedSessionUserPayloadObject) {
      const frontendOAuthFailureRedirectUrlValue =
        buildFrontendThirdPartyAuthenticationRedirectUrl({
          oauthStatusValue: "failed",
          oauthProviderNameValue: "third_party",
          oauthErrorCodeValue: "oauth_user_payload_missing"
        });

      return response.redirect(frontendOAuthFailureRedirectUrlValue);
    }

    // I also regenerate here for OAuth flow so login session id become fresh.
    await regenerateSessionStorePromise(request);
    await loginUserIntoPassportSessionPromise(
      request,
      authenticatedSessionUserPayloadObject
    );
    saveAuthenticatedUserPayloadIntoSessionStore(
      request,
      authenticatedSessionUserPayloadObject
    );

    const frontendOAuthSuccessRedirectUrlValue =
      buildFrontendThirdPartyAuthenticationRedirectUrl({
        oauthStatusValue: "success",
        oauthProviderNameValue:
          authenticatedSessionUserPayloadObject?.authProvider || "third_party"
      });

    return response.redirect(frontendOAuthSuccessRedirectUrlValue);
  } catch (error) {
    console.error("OAuth success redirect controller error:", error);

    const frontendOAuthFailureRedirectUrlValue =
      buildFrontendThirdPartyAuthenticationRedirectUrl({
        oauthStatusValue: "failed",
        oauthProviderNameValue: "third_party",
        oauthErrorCodeValue: "oauth_success_session_create_failed"
      });

    return response.redirect(frontendOAuthFailureRedirectUrlValue);
  }
}

function redirectAfterThirdPartyAuthenticationFailureController(
  request,
  response
) {
  const oauthProviderNameValue = request.query.provider || "third_party";
  const oauthErrorCodeValue =
    request.query.oauth_error_code || "strategy_authentication_failed";

  const frontendOAuthFailureRedirectUrlValue =
    buildFrontendThirdPartyAuthenticationRedirectUrl({
      oauthStatusValue: "failed",
      oauthProviderNameValue,
      oauthErrorCodeValue
    });

  return response.redirect(frontendOAuthFailureRedirectUrlValue);
}

function getCurrentAuthenticatedSessionUserController(request, response) {
  const authenticatedSessionUserPayloadObject =
    request.user || request.session?.authenticatedUser || null;

  if (!authenticatedSessionUserPayloadObject) {
    return response.status(401).json({
      message: "No authenticated session user found."
    });
  }

  return response.status(200).json({
    message: "Authenticated session user loaded.",
    user: authenticatedSessionUserPayloadObject
  });
}

function getAuthenticatedSessionStatusController(request, response) {
  const authenticatedSessionUserPayloadObject =
    request.user || request.session?.authenticatedUser || null;

  return response.status(200).json({
    message: authenticatedSessionUserPayloadObject
      ? "Authenticated session is active."
      : "Authenticated session is not active.",
    isAuthenticatedSessionActive: Boolean(authenticatedSessionUserPayloadObject),
    user: authenticatedSessionUserPayloadObject
  });
}

async function logoutAuthenticatedSessionUserController(request, response) {
  try {
    await logoutPassportSessionPromiseIfAvailable(request);
    await destroySessionStorePromise(request);

    const sessionCookieNameValue =
      process.env.SESSION_COOKIE_NAME ||
      "ecommerce_application_session_id_cookie_value";

    // I clear session cookie name used by express-session default, with custom fallback too.
    response.clearCookie("connect.sid");
    response.clearCookie(sessionCookieNameValue);

    return response.status(200).json({
      message: "Logout successful and session is destroyed."
    });
  } catch (error) {
    console.error("Logout endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying logout."
    });
  }
}

function buildFrontendThirdPartyAuthenticationRedirectUrl({
  oauthStatusValue,
  oauthProviderNameValue,
  oauthErrorCodeValue
}) {
  const frontendApplicationUrlValue =
    process.env.FRONTEND_APPLICATION_URL || "http://localhost:3000";
  const frontendLoginPageRedirectUrlObject = new URL(
    "/login",
    frontendApplicationUrlValue
  );

  frontendLoginPageRedirectUrlObject.searchParams.set(
    "oauth_status",
    oauthStatusValue
  );
  frontendLoginPageRedirectUrlObject.searchParams.set(
    "provider",
    oauthProviderNameValue
  );

  if (oauthErrorCodeValue) {
    frontendLoginPageRedirectUrlObject.searchParams.set(
      "oauth_error_code",
      oauthErrorCodeValue
    );
  }

  return frontendLoginPageRedirectUrlObject.toString();
}

function logoutPassportSessionPromiseIfAvailable(request) {
  return new Promise((resolve, reject) => {
    if (!request.logout) {
      resolve();
      return;
    }

    request.logout((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  loginUserWithUsernameAndPasswordController,
  handleThirdPartyAuthenticationSuccessRedirectController,
  redirectAfterThirdPartyAuthenticationFailureController,
  getCurrentAuthenticatedSessionUserController,
  getAuthenticatedSessionStatusController,
  logoutAuthenticatedSessionUserController
};
