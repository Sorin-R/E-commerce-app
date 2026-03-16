import { Link } from "react-router-dom";

// I make this function for ApplicationProductCardForListingPage logic here.
function ApplicationProductCardForListingPage({
  productIdValue,
  productNameValue,
  productDescriptionValue,
  productImageUrlValue
}) {
  return (
    <article className="ecom-app-product-list-page-product-card-box">
      <div className="ecom-app-prod-list-page-prod-card-image-wrap-box">
        <img
          className="ecom-app-product-list-page-product-card-image-el"
          src={
            productImageUrlValue ||
            "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
          }
          alt={buildProductCardImageAlternativeTextValue(productNameValue)}
          loading="lazy"
        />
      </div>

      <div className="ecom-app-prod-list-page-prod-card-content-wrap-box">
        <h3 className="ecom-app-product-list-page-product-card-title-text">
          {productNameValue}
        </h3>
        <p className="ecom-app-product-list-page-product-card-desc-text">
          {productDescriptionValue}
        </p>
      </div>

      <div className="ecom-app-prod-list-page-prod-card-act-wrap-box">
        <Link
          className="ecom-app-prod-list-page-prod-card-open-det--06a761"
          to={`/products/${productIdValue}`}
        >
          Open Product Details
        </Link>
      </div>
    </article>
  );
}

// I make this function for buildProductCardImageAlternativeTextValue logic here.
function buildProductCardImageAlternativeTextValue(productNameValue) {
  // I keep alt text clear for accessibility reader users.
  return `${productNameValue} product image`;
}

export default ApplicationProductCardForListingPage;
