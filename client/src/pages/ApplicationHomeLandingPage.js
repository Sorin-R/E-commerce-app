import { Link } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";

function ApplicationHomeLandingPage() {
  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Welcome to our E-Commerce App"
      pageDescriptionTextValue="This is starting home page for route setup. Next tasks will add real backend data."
    >
      {/* I add fast access links so we can test router is work good now. */}
      <div className="ecommerce-application-home-landing-page-quick-route-links-grid-container">
        <Link
          className="ecommerce-application-home-landing-page-quick-route-link-card-button-element"
          to="/register"
        >
          Go to Register Page
        </Link>
        <Link
          className="ecommerce-application-home-landing-page-quick-route-link-card-button-element"
          to="/login"
        >
          Go to Login Page
        </Link>
        <Link
          className="ecommerce-application-home-landing-page-quick-route-link-card-button-element"
          to="/products"
        >
          Go to Product Listing Page
        </Link>
      </div>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default ApplicationHomeLandingPage;
