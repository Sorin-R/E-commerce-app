function regenerateSessionStorePromise(request) {
  return new Promise((resolve, reject) => {
    if (!request.session) {
      resolve();
      return;
    }

    // I regenerate session id after login success to help against session fixation issue.
    request.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function loginUserIntoPassportSessionPromise(
  request,
  authenticatedUserSessionPayloadObject
) {
  return new Promise((resolve, reject) => {
    request.login(authenticatedUserSessionPayloadObject, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function saveAuthenticatedUserPayloadIntoSessionStore(
  request,
  authenticatedUserSessionPayloadObject
) {
  if (!request.session) {
    return;
  }

  // I keep one plain user payload in session object, this help simple checks later.
  request.session.authenticatedUser = authenticatedUserSessionPayloadObject;
}

function destroySessionStorePromise(request) {
  return new Promise((resolve, reject) => {
    if (!request.session) {
      resolve();
      return;
    }

    request.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  regenerateSessionStorePromise,
  loginUserIntoPassportSessionPromise,
  saveAuthenticatedUserPayloadIntoSessionStore,
  destroySessionStorePromise
};
