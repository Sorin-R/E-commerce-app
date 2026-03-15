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
    <header className="ecommerce-application-main-navigation-bar-wrapper-container">
      <div className="ecommerce-application-main-navigation-bar-inner-content-container">
        <div className="ecommerce-application-main-navigation-bar-brand-and-session-status-group-container">
          <h1 className="ecommerce-application-main-navigation-bar-brand-title-text">
            E-Commerce App
          </h1>
          <p className="ecommerce-application-main-navigation-bar-session-status-text-line">
            {buildNavigationSessionStatusTextValue({
              isAuthenticatedSessionStatusLoadingState,
              authenticatedSessionUserPayloadState
            })}
          </p>
          <p className="ecommerce-application-main-navigation-bar-current-active-cart-total-quantity-text-line">
            Current Cart Items:
            {" "}
            {currentActiveCartTotalQuantityState}
          </p>
        </div>

        <nav
          className="ecommerce-application-main-navigation-bar-links-list-container"
          aria-label="Main Navigation"
        >
          {/* I map link list from one array so we manage menu easier later. */}
          {applicationTopNavigationItemsList.map((applicationNavigationItem) => (
            <NavLink
              key={applicationNavigationItem.path}
              to={applicationNavigationItem.path}
              className={({ isActive }) =>
                isActive
                  ? "ecommerce-application-main-navigation-bar-link-button-active-state"
                  : "ecommerce-application-main-navigation-bar-link-button-default-state"
              }
              end={applicationNavigationItem.path === "/"}
            >
              {applicationNavigationItem.label}
            </NavLink>
          ))}
        </nav>

        {authenticatedSessionUserPayloadState ? (
          <div className="ecommerce-application-main-navigation-bar-authenticated-session-actions-group-container">
            <button
              className="ecommerce-application-main-navigation-bar-authenticated-session-logout-button-element"
              type="button"
              onClick={handleNavigationBarLogoutButtonClickAction}
              disabled={isNavigationBarLogoutRequestLoadingState}
            >
              {isNavigationBarLogoutRequestLoadingState
                ? "Logging out..."
                : "Logout"}
            </button>
            {navigationBarLogoutRequestErrorMessageState ? (
              <p className="ecommerce-application-main-navigation-bar-authenticated-session-logout-error-message-text-line">
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
