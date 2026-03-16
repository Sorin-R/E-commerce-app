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
  const normalizedUsernameTextValue = String(username || "").trim();
  const normalizedPasswordTextValue = String(password || "");

  if (!normalizedUsernameTextValue || !normalizedPasswordTextValue) {
    return response.status(400).json({
      message: "Username and password are required."
    });
  }

  try {
    const foundUserRecordData =
      await findOneUserRecordForLocalLoginByUsernameFromDatabase({
        usernameTextValue: normalizedUsernameTextValue
      });

    if (!foundUserRecordData) {
      return response.status(401).json({
        message: "Invalid username or password."
      });
    }

    const resolvedStoredPasswordCredentialTextValue =
      resolvePasswordCredentialTextValueFromDatabaseUserRowPayloadObjectValue(
        foundUserRecordData
      );

    if (!resolvedStoredPasswordCredentialTextValue) {
      return response.status(401).json({
        message:
          "This account use third-party login. Please login with Google or Facebook button."
      });
    }

    // I support bcrypt hash and also plain text credential for legacy seeded data.
    const isPasswordMatchingStoredCredentialResult =
      await compareLoginPasswordWithStoredCredentialTextValue({
        plainPasswordTextValue: normalizedPasswordTextValue,
        storedCredentialTextValue: resolvedStoredPasswordCredentialTextValue
      });

    if (!isPasswordMatchingStoredCredentialResult) {
      return response.status(401).json({
        message: "Invalid username or password."
      });
    }

    const resolvedUserIdValue =
      resolveUserIdValueFromDatabaseUserRowPayloadObjectValue(
        foundUserRecordData
      );

    if (!resolvedUserIdValue) {
      throw new Error(
        "Authenticated user id value is missing in users table row."
      );
    }

    const authenticatedUserSessionPayloadObject = {
      id: resolvedUserIdValue,
      username:
        resolveUsernameTextValueFromDatabaseUserRowPayloadObjectValue(
          foundUserRecordData
        ),
      authProvider:
        resolveAuthProviderTextValueFromDatabaseUserRowPayloadObjectValue(
          foundUserRecordData
        ),
      emailAddress:
        resolveEmailAddressTextValueFromDatabaseUserRowPayloadObjectValue(
          foundUserRecordData
        )
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

    if (error.code === "42P01") {
      return response.status(500).json({
        message: "Users table is missing in database."
      });
    }

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

async function findOneUserRecordForLocalLoginByUsernameFromDatabase({
  usernameTextValue
}) {
  const supportedUsernameColumnNameListValue = ["username", "user_name"];

  for (const usernameColumnNameValue of supportedUsernameColumnNameListValue) {
    try {
      const userSearchQueryResult = await postgresDatabasePoolConnection.query(
        `
          SELECT *
          FROM users
          WHERE LOWER(${usernameColumnNameValue}) = LOWER($1)
          LIMIT 1
        `,
        [usernameTextValue]
      );

      if (userSearchQueryResult.rowCount > 0) {
        return userSearchQueryResult.rows[0];
      }
    } catch (error) {
      // I skip unsupported username column and continue with next possible column name.
      if (error.code === "42703") {
        continue;
      }

      throw error;
    }
  }

  return null;
}

function resolvePasswordCredentialTextValueFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  const resolvedPasswordCredentialTextValue =
    databaseUserRowPayloadObjectValue.password_hash ||
    databaseUserRowPayloadObjectValue.password ||
    databaseUserRowPayloadObjectValue.hashed_password ||
    databaseUserRowPayloadObjectValue.passwordhash ||
    null;

  return resolvedPasswordCredentialTextValue
    ? String(resolvedPasswordCredentialTextValue)
    : null;
}

async function compareLoginPasswordWithStoredCredentialTextValue({
  plainPasswordTextValue,
  storedCredentialTextValue
}) {
  if (checkIfStoredCredentialLooksLikeBcryptHash(storedCredentialTextValue)) {
    return bcrypt.compare(plainPasswordTextValue, storedCredentialTextValue);
  }

  return String(plainPasswordTextValue) === String(storedCredentialTextValue);
}

function checkIfStoredCredentialLooksLikeBcryptHash(storedCredentialTextValue) {
  return /^\$2[aby]\$\d{2}\$/.test(String(storedCredentialTextValue || ""));
}

function resolveUserIdValueFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  const candidateUserIdValue =
    databaseUserRowPayloadObjectValue.id ??
    databaseUserRowPayloadObjectValue.user_id ??
    null;

  if (candidateUserIdValue === null || candidateUserIdValue === undefined) {
    return null;
  }

  const normalizedUserIdAsNumberValue = Number(candidateUserIdValue);

  if (
    Number.isInteger(normalizedUserIdAsNumberValue) &&
    normalizedUserIdAsNumberValue > 0
  ) {
    return normalizedUserIdAsNumberValue;
  }

  return String(candidateUserIdValue).trim() || null;
}

function resolveUsernameTextValueFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  return (
    databaseUserRowPayloadObjectValue.username ||
    databaseUserRowPayloadObjectValue.user_name ||
    "unknown_user"
  );
}

function resolveAuthProviderTextValueFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  return (
    databaseUserRowPayloadObjectValue.auth_provider ||
    databaseUserRowPayloadObjectValue.authprovider ||
    "local"
  );
}

function resolveEmailAddressTextValueFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  return (
    databaseUserRowPayloadObjectValue.email_address ||
    databaseUserRowPayloadObjectValue.email ||
    null
  );
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
