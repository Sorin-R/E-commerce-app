import { Link } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";

// I make this function for PageNotFoundPage logic here.
function PageNotFoundPage() {
  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Page Not Found"
      pageDescriptionTextValue="The route does not exist. You can go back using button below."
    >
      {/* I give user one clear action so they can return fast to home page. */}
      <Link
        className="ecom-app-not-found-page-back-to-home-link-btn-el"
        to="/"
      >
        Back to Home Page
      </Link>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default PageNotFoundPage;
