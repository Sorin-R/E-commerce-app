// I make this function for requireAuthenticatedSessionUserMiddleware logic here.
function requireAuthenticatedSessionUserMiddleware(request, response, next) {
  const hasRequestSessionIdentifierValue = Boolean(
    request.sessionID && request.session
  );
  const authenticatedSessionUserPayloadObject =
    request.user || request.session?.authenticatedUser || null;
  const hasAuthenticatedSessionUserIdValue = Boolean(
    authenticatedSessionUserPayloadObject?.id
  );

  if (
    !hasRequestSessionIdentifierValue ||
    !authenticatedSessionUserPayloadObject ||
    !hasAuthenticatedSessionUserIdValue
  ) {
    return response.status(401).json({
      message:
        "You need login first to access this protected resource with valid session id."
    });
  }

  const passportSessionUserIdValue = request.user?.id || null;
  const storedSessionUserIdValue = request.session?.authenticatedUser?.id || null;
  const normalizedPassportSessionUserIdTextValue = String(
    passportSessionUserIdValue || ""
  )
    .trim()
    .toLowerCase();
  const normalizedStoredSessionUserIdTextValue = String(
    storedSessionUserIdValue || ""
  )
    .trim()
    .toLowerCase();

  if (
    passportSessionUserIdValue &&
    storedSessionUserIdValue &&
    normalizedPassportSessionUserIdTextValue !==
      normalizedStoredSessionUserIdTextValue
  ) {
    return response.status(401).json({
      message: "Session user id validation failed for this protected resource."
    });
  }

  // I attach one normalized user payload in request so protected controllers use same value.
  request.authenticatedSessionUser = authenticatedSessionUserPayloadObject;
  return next();
}

module.exports = {
  requireAuthenticatedSessionUserMiddleware
};
