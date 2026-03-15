import { Link } from "react-router-dom";

function ApplicationProductCardForListingPage({
  productIdValue,
  productNameValue,
  productDescriptionValue,
  productImageUrlValue
}) {
  return (
    <article className="ecommerce-application-product-listing-page-product-card-container">
      <div className="ecommerce-application-product-listing-page-product-card-image-wrapper-container">
        <img
          className="ecommerce-application-product-listing-page-product-card-image-element"
          src={
            productImageUrlValue ||
            "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
          }
          alt={buildProductCardImageAlternativeTextValue(productNameValue)}
          loading="lazy"
        />
      </div>

      <div className="ecommerce-application-product-listing-page-product-card-content-wrapper-container">
        <h3 className="ecommerce-application-product-listing-page-product-card-title-text">
          {productNameValue}
        </h3>
        <p className="ecommerce-application-product-listing-page-product-card-description-text">
          {productDescriptionValue}
        </p>
      </div>

      <div className="ecommerce-application-product-listing-page-product-card-actions-wrapper-container">
        <Link
          className="ecommerce-application-product-listing-page-product-card-open-details-link-button-element"
          to={`/products/${productIdValue}`}
        >
          Open Product Details
        </Link>
      </div>
    </article>
  );
}

function buildProductCardImageAlternativeTextValue(productNameValue) {
  // I keep alt text clear for accessibility reader users.
  return `${productNameValue} product image`;
}

export default ApplicationProductCardForListingPage;
