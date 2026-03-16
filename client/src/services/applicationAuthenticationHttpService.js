import { getFrontendApplicationBackendApiBaseUrlTextValue } from "./applicationBackendBaseUrlSupportService";

const frontendApplicationApiBaseUrlValue =
  getFrontendApplicationBackendApiBaseUrlTextValue();

export async function registerWithUsernameAndPasswordRequest({
  username,
  password
}) {
  // I call backend register endpoint and backend create account with hashed password.
  const registerHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        password
      })
    }
  );

  const parsedRegisterResponseData =
    await parseJsonResponseBodySafely(registerHttpResponse);

  if (!registerHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: registerHttpResponse.status,
      fallbackMessageTextValue: "Register request is not successful.",
      parsedResponseBodyPayloadObject: parsedRegisterResponseData
    });
  }

  return parsedRegisterResponseData;
}

export async function loginWithUsernameAndPasswordRequest({
  username,
  password
}) {
  // Here I call backend login endpoint and send username/password in json body.
  const loginHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        password
      })
    }
  );

  const parsedLoginResponseData =
    await parseJsonResponseBodySafely(loginHttpResponse);

  if (!loginHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: loginHttpResponse.status,
      fallbackMessageTextValue: "Login request is not successful.",
      parsedResponseBodyPayloadObject: parsedLoginResponseData
    });
  }

  return parsedLoginResponseData;
}

export async function getAuthenticatedSessionStatusRequest() {
  // I call this endpoint on app boot so page know if user already login from old session.
  const sessionStatusHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/auth/session-status`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  const parsedSessionStatusResponseData =
    await parseJsonResponseBodySafely(sessionStatusHttpResponse);

  if (!sessionStatusHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: sessionStatusHttpResponse.status,
      fallbackMessageTextValue: "Session status request is not successful.",
      parsedResponseBodyPayloadObject: parsedSessionStatusResponseData
    });
  }

  return parsedSessionStatusResponseData;
}

export async function logoutAuthenticatedSessionUserRequest() {
  // I call backend logout endpoint to destroy session cookie and server session store value.
  const logoutHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/auth/logout`,
    {
      method: "POST",
      credentials: "include"
    }
  );

  const parsedLogoutResponseData =
    await parseJsonResponseBodySafely(logoutHttpResponse);

  if (!logoutHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: logoutHttpResponse.status,
      fallbackMessageTextValue: "Logout request is not successful.",
      parsedResponseBodyPayloadObject: parsedLogoutResponseData
    });
  }

  return parsedLogoutResponseData;
}

export function redirectToThirdPartyProviderAuthentication(providerNameValue) {
  // I keep this redirect simple for now, later we can add callback handling state.
  window.location.href = `${frontendApplicationApiBaseUrlValue}/api/auth/${providerNameValue}`;
}

async function parseJsonResponseBodySafely(httpResponseObjectValue) {
  // Some response maybe empty text, so I parse safe and return empty object.
  const responseBodyRawTextValue = await httpResponseObjectValue.text();

  if (!responseBodyRawTextValue) {
    return {};
  }

  try {
    return JSON.parse(responseBodyRawTextValue);
  } catch {
    return {};
  }
}

function buildHttpRequestErrorObject({
  httpStatusCodeValue,
  fallbackMessageTextValue,
  parsedResponseBodyPayloadObject
}) {
  const httpRequestErrorObject = new Error(
    parsedResponseBodyPayloadObject.message || fallbackMessageTextValue
  );
  httpRequestErrorObject.httpStatusCodeValue = httpStatusCodeValue;
  return httpRequestErrorObject;
}
