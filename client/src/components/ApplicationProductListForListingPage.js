import ApplicationProductCardForListingPage from "./ApplicationProductCardForListingPage";

function ApplicationProductListForListingPage({ productCatalogListValue }) {
  if (!productCatalogListValue.length) {
    return (
      <div className="ecommerce-application-product-listing-page-empty-state-wrapper-container">
        <p className="ecommerce-application-product-listing-page-empty-state-message-text-line">
          No products found for now.
        </p>
      </div>
    );
  }

  return (
    <ul className="ecommerce-application-product-listing-page-product-grid-list-container">
      {productCatalogListValue.map((productCatalogItemObjectValue) => (
        <li
          key={productCatalogItemObjectValue.id}
          className="ecommerce-application-product-listing-page-product-grid-list-item-container"
        >
          <ApplicationProductCardForListingPage
            productIdValue={productCatalogItemObjectValue.id}
            productNameValue={productCatalogItemObjectValue.name}
            productDescriptionValue={productCatalogItemObjectValue.description}
            productImageUrlValue={productCatalogItemObjectValue.imageUrl}
          />
        </li>
      ))}
    </ul>
  );
}

export default ApplicationProductListForListingPage;
