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

    const authenticatedUserSessionPayloadObject =
      buildAuthenticatedSessionUserPayloadFromDatabaseUserRowPayloadObjectValue(
        foundUserRecordData
      );

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
      message: "Server error when trying login.",
      errorCodeValue: error.code || null
    });
  }
}

async function registerUserWithUsernameAndPasswordController(request, response) {
  const { username, password } = request.body;
  const normalizedUsernameTextValue = String(username || "").trim();
  const normalizedPasswordTextValue = String(password || "");

  if (!normalizedUsernameTextValue || !normalizedPasswordTextValue) {
    return response.status(400).json({
      message: "Username and password are required."
    });
  }

  if (normalizedUsernameTextValue.length < 3) {
    return response.status(400).json({
      message: "Username must be at least 3 characters long."
    });
  }

  if (normalizedPasswordTextValue.length < 6) {
    return response.status(400).json({
      message: "Password must be at least 6 characters long."
    });
  }

  try {
    const usersTableColumnMetadataListValue =
      await loadUsersTableColumnMetadataListFromDatabase();
    const resolvedUsernameColumnNameValue =
      resolveSupportedUsersTableColumnNameOrNull(
        usersTableColumnMetadataListValue,
        ["username", "user_name"]
      );
    const resolvedPasswordColumnNameValue =
      resolveSupportedUsersTableColumnNameOrNull(
        usersTableColumnMetadataListValue,
        ["password_hash", "password", "hashed_password", "passwordhash"]
      );

    if (!resolvedUsernameColumnNameValue || !resolvedPasswordColumnNameValue) {
      return response.status(500).json({
        message:
          "Users table does not have supported columns for register flow."
      });
    }

    const doesUsernameAlreadyExistResult =
      await checkIfUsersTableUsernameAlreadyExistsValue({
        usernameTextValue: normalizedUsernameTextValue,
        resolvedUsernameColumnNameValue
      });

    if (doesUsernameAlreadyExistResult) {
      return response.status(409).json({
        message: "This username is already taken. Please choose another one."
      });
    }

    const hashedPasswordTextValue = await bcrypt.hash(
      normalizedPasswordTextValue,
      10
    );
    const createdUserRowPayloadObjectValue =
      await insertNewLocalUserAccountIntoUsersTable({
        usersTableColumnMetadataListValue,
        resolvedUsernameColumnNameValue,
        resolvedPasswordColumnNameValue,
        usernameTextValue: normalizedUsernameTextValue,
        hashedPasswordTextValue
      });

    if (!createdUserRowPayloadObjectValue) {
      throw new Error("Users insert query did not return created row.");
    }

    const authenticatedUserSessionPayloadObject =
      buildAuthenticatedSessionUserPayloadFromDatabaseUserRowPayloadObjectValue(
        createdUserRowPayloadObjectValue
      );

    await regenerateSessionStorePromise(request);
    await loginUserIntoPassportSessionPromise(
      request,
      authenticatedUserSessionPayloadObject
    );
    saveAuthenticatedUserPayloadIntoSessionStore(
      request,
      authenticatedUserSessionPayloadObject
    );

    return response.status(201).json({
      message: "Register successful.",
      user: authenticatedUserSessionPayloadObject
    });
  } catch (error) {
    console.error("Register endpoint error:", error);

    if (error.code === "23505") {
      return response.status(409).json({
        message: "This username is already taken. Please choose another one."
      });
    }

    if (error.code === "42P01") {
      return response.status(500).json({
        message: "Users table is missing in database."
      });
    }

    return response.status(500).json({
      message: "Server error when trying register.",
      errorCodeValue: error.code || null
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
  const supportedUsernameColumnNameListValue = [
    "username",
    "user_name",
    "email",
    "email_address"
  ];

  for (const usernameColumnNameValue of supportedUsernameColumnNameListValue) {
    try {
      const userSearchQueryResult = await postgresDatabasePoolConnection.query(
        `
          SELECT *
          FROM users
          WHERE LOWER(CAST(${usernameColumnNameValue} AS TEXT)) = LOWER($1)
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
  try {
    if (checkIfStoredCredentialLooksLikeBcryptHash(storedCredentialTextValue)) {
      return bcrypt.compare(plainPasswordTextValue, storedCredentialTextValue);
    }

    return String(plainPasswordTextValue) === String(storedCredentialTextValue);
  } catch {
    return false;
  }
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
    databaseUserRowPayloadObjectValue.userid ??
    databaseUserRowPayloadObjectValue.uuid ??
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

function buildAuthenticatedSessionUserPayloadFromDatabaseUserRowPayloadObjectValue(
  databaseUserRowPayloadObjectValue
) {
  const resolvedUserIdValue =
    resolveUserIdValueFromDatabaseUserRowPayloadObjectValue(
      databaseUserRowPayloadObjectValue
    );

  return {
    id:
      resolvedUserIdValue ||
      resolveUsernameTextValueFromDatabaseUserRowPayloadObjectValue(
        databaseUserRowPayloadObjectValue
      ) ||
      `session_user_${Date.now()}`,
    username: resolveUsernameTextValueFromDatabaseUserRowPayloadObjectValue(
      databaseUserRowPayloadObjectValue
    ),
    authProvider:
      resolveAuthProviderTextValueFromDatabaseUserRowPayloadObjectValue(
        databaseUserRowPayloadObjectValue
      ),
    emailAddress:
      resolveEmailAddressTextValueFromDatabaseUserRowPayloadObjectValue(
        databaseUserRowPayloadObjectValue
      )
  };
}

async function loadUsersTableColumnMetadataListFromDatabase() {
  const usersTableColumnsQueryResult = await postgresDatabasePoolConnection.query(
    `
      SELECT
        column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'users'
      ORDER BY ordinal_position ASC
    `
  );

  return usersTableColumnsQueryResult.rows || [];
}

function resolveSupportedUsersTableColumnNameOrNull(
  usersTableColumnMetadataListValue,
  supportedUsersTableColumnNameListValue
) {
  const usersTableColumnNameSetValue = new Set(
    usersTableColumnMetadataListValue.map((usersTableColumnMetadataObjectValue) =>
      String(usersTableColumnMetadataObjectValue.column_name || "").trim()
    )
  );

  return (
    supportedUsersTableColumnNameListValue.find((supportedUsersTableColumnNameValue) =>
      usersTableColumnNameSetValue.has(supportedUsersTableColumnNameValue)
    ) || null
  );
}

async function checkIfUsersTableUsernameAlreadyExistsValue({
  usernameTextValue,
  resolvedUsernameColumnNameValue
}) {
  const existingUsernameSearchQueryResult =
    await postgresDatabasePoolConnection.query(
      `
        SELECT 1
        FROM users
        WHERE LOWER(CAST(${resolvedUsernameColumnNameValue} AS TEXT)) = LOWER($1)
        LIMIT 1
      `,
      [usernameTextValue]
    );

  return existingUsernameSearchQueryResult.rowCount > 0;
}

async function insertNewLocalUserAccountIntoUsersTable({
  usersTableColumnMetadataListValue,
  resolvedUsernameColumnNameValue,
  resolvedPasswordColumnNameValue,
  usernameTextValue,
  hashedPasswordTextValue
}) {
  const usersTableColumnNameSetValue = new Set(
    usersTableColumnMetadataListValue.map((usersTableColumnMetadataObjectValue) =>
      String(usersTableColumnMetadataObjectValue.column_name || "").trim()
    )
  );
  const insertColumnNameListValue = [
    resolvedUsernameColumnNameValue,
    resolvedPasswordColumnNameValue
  ];
  const insertColumnValueListValue = [usernameTextValue, hashedPasswordTextValue];

  // I set auth provider local when column exists so app can tell local and oauth users.
  if (usersTableColumnNameSetValue.has("auth_provider")) {
    insertColumnNameListValue.push("auth_provider");
    insertColumnValueListValue.push("local");
  }

  // I set display name to username when possible so user profile text is not empty.
  if (usersTableColumnNameSetValue.has("display_name")) {
    insertColumnNameListValue.push("display_name");
    insertColumnValueListValue.push(usernameTextValue);
  }

  const insertColumnPlaceholderListTextValue = insertColumnValueListValue
    .map((_, insertColumnValueIndexValue) => `$${insertColumnValueIndexValue + 1}`)
    .join(", ");
  const createdUserInsertQueryResult = await postgresDatabasePoolConnection.query(
    `
      INSERT INTO users (${insertColumnNameListValue.join(", ")})
      VALUES (${insertColumnPlaceholderListTextValue})
      RETURNING *
    `,
    insertColumnValueListValue
  );

  return createdUserInsertQueryResult.rows[0] || null;
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
  registerUserWithUsernameAndPasswordController,
  loginUserWithUsernameAndPasswordController,
  handleThirdPartyAuthenticationSuccessRedirectController,
  redirectAfterThirdPartyAuthenticationFailureController,
  getCurrentAuthenticatedSessionUserController,
  getAuthenticatedSessionStatusController,
  logoutAuthenticatedSessionUserController
};
