import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";

function ApplicationProtectedRouteForAuthenticatedSessionUser() {
  const {
    isAuthenticatedSessionActiveStateValue,
    isAuthenticatedSessionStatusLoadingState
  } = useApplicationAuthenticationSessionContext();
  const currentPageLocationObject = useLocation();

  if (isAuthenticatedSessionStatusLoadingState) {
    return (
      <div className="ecommerce-application-protected-route-session-validation-loading-state-wrapper-container">
        <p className="ecommerce-application-protected-route-session-validation-loading-state-message-text-line">
          Checking authentication session before opening protected page...
        </p>
      </div>
    );
  }

  if (!isAuthenticatedSessionActiveStateValue) {
    // I keep target path in router state so login page can send user back after auth success.
    return (
      <Navigate
        to="/login"
        replace
        state={{
          redirectAfterLoginPathValue:
            `${currentPageLocationObject.pathname}${currentPageLocationObject.search}`
        }}
      />
    );
  }

  return <Outlet />;
}

export default ApplicationProtectedRouteForAuthenticatedSessionUser;
