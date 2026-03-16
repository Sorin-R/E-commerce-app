const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const {
  postgresDatabasePoolConnection
} = require("../database/postgresDatabasePoolConnection");

let hasPassportThirdPartyConfigurationRanValue = false;

function configurePassportThirdPartyAuthenticationStrategies() {
  // I guard this function because in some runtime it can be called more than one time.
  if (hasPassportThirdPartyConfigurationRanValue) {
    return;
  }

  configurePassportSessionSerializationHandlers();
  configureGoogleThirdPartyAuthenticationStrategyIfReady();
  configureFacebookThirdPartyAuthenticationStrategyIfReady();

  hasPassportThirdPartyConfigurationRanValue = true;
}

function isPassportStrategyConfiguredByName(strategyNameValue) {
  // This check helps route know if provider strategy is ready before redirect user.
  return Boolean(passport._strategy(strategyNameValue));
}

function configurePassportSessionSerializationHandlers() {
  passport.serializeUser((authenticatedUserPayloadObjectValue, done) => {
    done(null, authenticatedUserPayloadObjectValue.id);
  });

  passport.deserializeUser(async (authenticatedUserIdValue, done) => {
    try {
      const foundAuthenticatedUserRecordData =
        await findOneUserRecordBySessionIdFromDatabase({
          authenticatedUserIdValue
        });

      if (!foundAuthenticatedUserRecordData) {
        return done(null, false);
      }

      const authenticatedUserSessionPayloadObject =
        mapDatabaseUserRowToAuthenticatedUserSessionPayload(
          foundAuthenticatedUserRecordData
        );

      return done(null, authenticatedUserSessionPayloadObject);
    } catch (error) {
      return done(error);
    }
  });
}

function configureGoogleThirdPartyAuthenticationStrategyIfReady() {
  const isGoogleThirdPartyAuthenticationConfigPresentResult = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );

  if (!isGoogleThirdPartyAuthenticationConfigPresentResult) {
    console.warn(
      "Google OAuth is skipped because GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are missing."
    );
    return;
  }

  const backendApplicationPublicBaseUrlValue =
    process.env.BACKEND_APPLICATION_URL || "http://localhost:3001";
  const googleOAuthCallbackUrlValue =
    process.env.GOOGLE_OAUTH_CALLBACK_URL ||
    `${backendApplicationPublicBaseUrlValue}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: googleOAuthCallbackUrlValue
      },
      createThirdPartyPassportVerifyCallbackFunction("google")
    )
  );
}

function configureFacebookThirdPartyAuthenticationStrategyIfReady() {
  const isFacebookThirdPartyAuthenticationConfigPresentResult = Boolean(
    process.env.FACEBOOK_OAUTH_APP_ID && process.env.FACEBOOK_OAUTH_APP_SECRET
  );

  if (!isFacebookThirdPartyAuthenticationConfigPresentResult) {
    console.warn(
      "Facebook OAuth is skipped because FACEBOOK_OAUTH_APP_ID / FACEBOOK_OAUTH_APP_SECRET are missing."
    );
    return;
  }

  const backendApplicationPublicBaseUrlValue =
    process.env.BACKEND_APPLICATION_URL || "http://localhost:3001";
  const facebookOAuthCallbackUrlValue =
    process.env.FACEBOOK_OAUTH_CALLBACK_URL ||
    `${backendApplicationPublicBaseUrlValue}/api/auth/facebook/callback`;

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_OAUTH_APP_ID,
        clientSecret: process.env.FACEBOOK_OAUTH_APP_SECRET,
        callbackURL: facebookOAuthCallbackUrlValue,
        profileFields: ["id", "displayName", "emails", "photos"]
      },
      createThirdPartyPassportVerifyCallbackFunction("facebook")
    )
  );
}

function createThirdPartyPassportVerifyCallbackFunction(
  oauthProviderNameValue
) {
  return async (
    accessTokenValue,
    refreshTokenValue,
    oauthProfilePayloadObjectValue,
    done
  ) => {
    try {
      const oauthProviderUserIdValue = oauthProfilePayloadObjectValue.id;
      const oauthProviderDisplayNameValue =
        oauthProfilePayloadObjectValue.displayName || null;
      const oauthProviderEmailAddressValue =
        oauthProfilePayloadObjectValue.emails?.[0]?.value || null;
      const oauthProviderProfilePhotoUrlValue =
        oauthProfilePayloadObjectValue.photos?.[0]?.value || null;

      const authenticatedUserSessionPayloadObjectValue =
        await findOrCreateUserFromThirdPartyProfileInDatabase({
          oauthProviderNameValue,
          oauthProviderUserIdValue,
          oauthProviderDisplayNameValue,
          oauthProviderEmailAddressValue,
          oauthProviderProfilePhotoUrlValue
        });

      return done(null, authenticatedUserSessionPayloadObjectValue);
    } catch (error) {
      return done(error);
    }
  };
}

async function findOrCreateUserFromThirdPartyProfileInDatabase({
  oauthProviderNameValue,
  oauthProviderUserIdValue,
  oauthProviderDisplayNameValue,
  oauthProviderEmailAddressValue,
  oauthProviderProfilePhotoUrlValue
}) {
  // First I try find user by provider + provider id, this is most precise match.
  const providerPairSearchQueryResult = await postgresDatabasePoolConnection.query(
    `
      SELECT id, username, auth_provider, email_address
      FROM users
      WHERE auth_provider = $1
        AND provider_user_id = $2
      LIMIT 1
    `,
    [oauthProviderNameValue, oauthProviderUserIdValue]
  );

  if (providerPairSearchQueryResult.rowCount > 0) {
    return mapDatabaseUserRowToAuthenticatedUserSessionPayload(
      providerPairSearchQueryResult.rows[0]
    );
  }

  if (oauthProviderEmailAddressValue) {
    const emailSearchQueryResult = await postgresDatabasePoolConnection.query(
      `
        SELECT id, username, auth_provider, email_address
        FROM users
        WHERE LOWER(email_address) = LOWER($1)
        LIMIT 1
      `,
      [oauthProviderEmailAddressValue]
    );

    if (emailSearchQueryResult.rowCount > 0) {
      const linkedExistingUserRecordData = emailSearchQueryResult.rows[0];
      const updatedLinkedUserQueryResult =
        await postgresDatabasePoolConnection.query(
          `
            UPDATE users
            SET auth_provider = $1,
                provider_user_id = $2,
                display_name = COALESCE($3, display_name),
                profile_image_url = COALESCE($4, profile_image_url)
            WHERE id = $5
            RETURNING id, username, auth_provider, email_address
          `,
          [
            oauthProviderNameValue,
            oauthProviderUserIdValue,
            oauthProviderDisplayNameValue,
            oauthProviderProfilePhotoUrlValue,
            linkedExistingUserRecordData.id
          ]
        );

      return mapDatabaseUserRowToAuthenticatedUserSessionPayload(
        updatedLinkedUserQueryResult.rows[0]
      );
    }
  }

  const generatedUniqueUsernameForOauthUserValue =
    await buildUniqueUsernameForThirdPartyUser({
      oauthProviderNameValue,
      oauthProviderDisplayNameValue,
      oauthProviderUserIdValue
    });

  const createdOauthUserInsertQueryResult =
    await postgresDatabasePoolConnection.query(
      `
        INSERT INTO users (
          username,
          password_hash,
          auth_provider,
          provider_user_id,
          email_address,
          display_name,
          profile_image_url
        )
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
        RETURNING id, username, auth_provider, email_address
      `,
      [
        generatedUniqueUsernameForOauthUserValue,
        oauthProviderNameValue,
        oauthProviderUserIdValue,
        oauthProviderEmailAddressValue,
        oauthProviderDisplayNameValue,
        oauthProviderProfilePhotoUrlValue
      ]
    );

  return mapDatabaseUserRowToAuthenticatedUserSessionPayload(
    createdOauthUserInsertQueryResult.rows[0]
  );
}

async function buildUniqueUsernameForThirdPartyUser({
  oauthProviderNameValue,
  oauthProviderDisplayNameValue,
  oauthProviderUserIdValue
}) {
  const cleanedDisplayNameForUsernameValue = (
    oauthProviderDisplayNameValue || `${oauthProviderNameValue}_user`
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  const cleanedProviderUserIdForUsernameValue = String(
    oauthProviderUserIdValue
  )
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-10);

  const usernamePrefixValue =
    cleanedDisplayNameForUsernameValue || `${oauthProviderNameValue}_user`;
  const usernameSuffixBaseValue =
    cleanedProviderUserIdForUsernameValue || `${Date.now()}`;

  for (
    let usernameAttemptCounterValue = 0;
    usernameAttemptCounterValue < 20;
    usernameAttemptCounterValue += 1
  ) {
    const candidateUsernameForThirdPartyUserValue =
      usernameAttemptCounterValue === 0
        ? `${usernamePrefixValue}_oauth_${usernameSuffixBaseValue}`
        : `${usernamePrefixValue}_oauth_${usernameSuffixBaseValue}_${usernameAttemptCounterValue}`;

    const usernameSearchQueryResult = await postgresDatabasePoolConnection.query(
      `
        SELECT 1
        FROM users
        WHERE username = $1
        LIMIT 1
      `,
      [candidateUsernameForThirdPartyUserValue]
    );

    if (usernameSearchQueryResult.rowCount === 0) {
      return candidateUsernameForThirdPartyUserValue;
    }
  }

  return `${usernamePrefixValue}_oauth_${Date.now()}`;
}

function mapDatabaseUserRowToAuthenticatedUserSessionPayload(
  databaseUserRowPayloadObjectValue
) {
  return {
    id:
      databaseUserRowPayloadObjectValue.id ??
      databaseUserRowPayloadObjectValue.user_id,
    username:
      databaseUserRowPayloadObjectValue.username ||
      databaseUserRowPayloadObjectValue.user_name ||
      "unknown_user",
    authProvider:
      databaseUserRowPayloadObjectValue.auth_provider ||
      databaseUserRowPayloadObjectValue.authprovider ||
      "local",
    emailAddress:
      databaseUserRowPayloadObjectValue.email_address ||
      databaseUserRowPayloadObjectValue.email ||
      null
  };
}

async function findOneUserRecordBySessionIdFromDatabase({
  authenticatedUserIdValue
}) {
  const supportedUserIdColumnNameListValue = ["id", "user_id"];

  for (const userIdColumnNameValue of supportedUserIdColumnNameListValue) {
    try {
      const authenticatedUserSearchQueryResult =
        await postgresDatabasePoolConnection.query(
          `
            SELECT *
            FROM users
            WHERE ${userIdColumnNameValue} = $1
            LIMIT 1
          `,
          [authenticatedUserIdValue]
        );

      if (authenticatedUserSearchQueryResult.rowCount > 0) {
        return authenticatedUserSearchQueryResult.rows[0];
      }
    } catch (error) {
      // I skip unsupported user id column and try another common naming style.
      if (error.code === "42703") {
        continue;
      }

      throw error;
    }
  }

  const supportedUsernameLookupColumnNameListValue = [
    "username",
    "user_name",
    "email",
    "email_address"
  ];

  for (const usernameLookupColumnNameValue of supportedUsernameLookupColumnNameListValue) {
    try {
      const authenticatedUserSearchQueryResult =
        await postgresDatabasePoolConnection.query(
          `
            SELECT *
            FROM users
            WHERE CAST(${usernameLookupColumnNameValue} AS TEXT) = $1
            LIMIT 1
          `,
          [String(authenticatedUserIdValue)]
        );

      if (authenticatedUserSearchQueryResult.rowCount > 0) {
        return authenticatedUserSearchQueryResult.rows[0];
      }
    } catch (error) {
      if (error.code === "42703") {
        continue;
      }

      throw error;
    }
  }

  return null;
}

module.exports = {
  configurePassportThirdPartyAuthenticationStrategies,
  isPassportStrategyConfiguredByName
};
