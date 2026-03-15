import { Navigate, Route, Routes } from "react-router-dom";
import ApplicationMainNavigationBar from "./components/ApplicationMainNavigationBar";
import ApplicationHomeLandingPage from "./pages/ApplicationHomeLandingPage";
import UserRegistrationPage from "./pages/UserRegistrationPage";
import UserLoginPage from "./pages/UserLoginPage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutFlowPage from "./pages/CheckoutFlowPage";
import UserOrderHistoryPage from "./pages/UserOrderHistoryPage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import ApplicationProtectedRouteForAuthenticatedSessionUser from "./components/ApplicationProtectedRouteForAuthenticatedSessionUser";
import "./styles/applicationRouterLayoutStyles.css";

function App() {
  return (
    <div className="ecommerce-application-main-router-shell-wrapper-container">
      <ApplicationMainNavigationBar />

      <main className="ecommerce-application-main-router-page-content-area-container">
        {/* I setup all page routes here so user can navigate full app easy. */}
        <Routes>
          <Route path="/" element={<ApplicationHomeLandingPage />} />
          <Route path="/register" element={<UserRegistrationPage />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route
            element={<ApplicationProtectedRouteForAuthenticatedSessionUser />}
          >
            <Route path="/checkout" element={<CheckoutFlowPage />} />
            <Route path="/order-history" element={<UserOrderHistoryPage />} />
          </Route>
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
