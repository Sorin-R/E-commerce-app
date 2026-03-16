import { Link } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";

// I make this function for ApplicationHomeLandingPage logic here.
function ApplicationHomeLandingPage() {
  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Welcome to our E-Commerce App"
      pageDescriptionTextValue="This is starting home page for route setup. Next tasks will add real backend data."
    >
      {/* I add fast access links so we can test router is work good now. */}
      <div className="ecom-app-home-page-quick-route-links-grid-box">
        <Link
          className="ecom-app-home-page-quick-route-link-card-btn-el"
          to="/register"
        >
          Go to Register Page
        </Link>
        <Link
          className="ecom-app-home-page-quick-route-link-card-btn-el"
          to="/login"
        >
          Go to Login Page
        </Link>
        <Link
          className="ecom-app-home-page-quick-route-link-card-btn-el"
          to="/products"
        >
          Go to Product Listing Page
        </Link>
      </div>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default ApplicationHomeLandingPage;
