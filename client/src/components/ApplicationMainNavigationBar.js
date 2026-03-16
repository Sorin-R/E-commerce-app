import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { useApplicationShoppingCartTrackingContext } from "../context/ApplicationShoppingCartTrackingContextProvider";

const applicationTopNavigationItemsList = [
  { path: "/", label: "Home" },
  { path: "/register", label: "Register" },
  { path: "/login", label: "Login" },
  { path: "/products", label: "Products" },
  { path: "/checkout", label: "Checkout" },
  { path: "/order-history", label: "Order History" }
];

// I make this function for ApplicationMainNavigationBar logic here.
function ApplicationMainNavigationBar() {
  const {
    authenticatedSessionUserPayloadState,
    isAuthenticatedSessionStatusLoadingState,
    logoutAuthenticatedSessionUserFromBackendAction
  } = useApplicationAuthenticationSessionContext();
  const [isNavigationBarLogoutRequestLoadingState, setIsNavigationBarLogoutRequestLoadingState] =
    useState(false);
  const [navigationBarLogoutRequestErrorMessageState, setNavigationBarLogoutRequestErrorMessageState] =
    useState("");
  const navigate = useNavigate();
  const { currentActiveCartTotalQuantityState } =
    useApplicationShoppingCartTrackingContext();

  // I make this function for handleNavigationBarLogoutButtonClickAction logic here.
  const handleNavigationBarLogoutButtonClickAction = async () => {
    try {
      setIsNavigationBarLogoutRequestLoadingState(true);
      setNavigationBarLogoutRequestErrorMessageState("");

      await logoutAuthenticatedSessionUserFromBackendAction();
      navigate("/login");
    } catch (error) {
      setNavigationBarLogoutRequestErrorMessageState(
        error.message || "Logout request failed. Please try again."
      );
    } finally {
      setIsNavigationBarLogoutRequestLoadingState(false);
    }
  };

  return (
    <header className="ecom-app-main-nav-wrap-box">
      <div className="ecom-app-main-nav-inner-content-box">
        <div className="ecom-app-main-nav-brand-and-sess-stat-group-box">
          <h1 className="ecom-app-main-nav-brand-title-text">
            E-Commerce App
          </h1>
          <p className="ecom-app-main-nav-session-status-text-line">
            {buildNavigationSessionStatusTextValue({
              isAuthenticatedSessionStatusLoadingState,
              authenticatedSessionUserPayloadState
            })}
          </p>
          <p className="ecom-app-main-nav-active-cart-total-qty-text-line">
            Current Cart Items:
            {" "}
            {currentActiveCartTotalQuantityState}
          </p>
        </div>

        <nav
          className="ecom-app-main-nav-links-list-box"
          aria-label="Main Navigation"
        >
          {/* I map link list from one array so we manage menu easier later. */}
          {applicationTopNavigationItemsList.map((applicationNavigationItem) => (
            <NavLink
              key={applicationNavigationItem.path}
              to={applicationNavigationItem.path}
              className={({ isActive }) =>
                isActive
                  ? "ecom-app-main-nav-link-btn-active-state"
                  : "ecom-app-main-nav-link-btn-default-state"
              }
              end={applicationNavigationItem.path === "/"}
            >
              {applicationNavigationItem.label}
            </NavLink>
          ))}
        </nav>

        {authenticatedSessionUserPayloadState ? (
          <div className="ecom-app-main-nav-auth-session-actions-group-box">
            <button
              className="ecom-app-main-nav-auth-session-logout-btn-el"
              type="button"
              onClick={handleNavigationBarLogoutButtonClickAction}
              disabled={isNavigationBarLogoutRequestLoadingState}
            >
              {isNavigationBarLogoutRequestLoadingState
                ? "Logging out..."
                : "Logout"}
            </button>
            {navigationBarLogoutRequestErrorMessageState ? (
              <p className="ecom-app-main-nav-auth-sess-logout-error-ms-d67e1b">
                {navigationBarLogoutRequestErrorMessageState}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default ApplicationMainNavigationBar;

// I make this function for buildNavigationSessionStatusTextValue logic here.
function buildNavigationSessionStatusTextValue({
  isAuthenticatedSessionStatusLoadingState,
  authenticatedSessionUserPayloadState
}) {
  if (isAuthenticatedSessionStatusLoadingState) {
    return "Session checking...";
  }

  if (authenticatedSessionUserPayloadState) {
    return `Logged in as ${authenticatedSessionUserPayloadState.username}`;
  }

  return "Not logged in";
}
