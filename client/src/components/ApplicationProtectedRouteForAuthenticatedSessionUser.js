import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";

// I make this function for ApplicationProtectedRouteForAuthenticatedSessionUser logic here.
function ApplicationProtectedRouteForAuthenticatedSessionUser() {
  const {
    isAuthenticatedSessionActiveStateValue,
    isAuthenticatedSessionStatusLoadingState
  } = useApplicationAuthenticationSessionContext();
  const currentPageLocationObject = useLocation();

  if (isAuthenticatedSessionStatusLoadingState) {
    return (
      <div className="ecom-app-prot-route-sess-valid-load-state-wrap-box">
        <p className="ecom-app-prot-route-sess-valid-load-state-m-506e17">
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
