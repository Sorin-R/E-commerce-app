import ApplicationProductCardForListingPage from "./ApplicationProductCardForListingPage";

// I make this function for ApplicationProductListForListingPage logic here.
function ApplicationProductListForListingPage({ productCatalogListValue }) {
  if (!productCatalogListValue.length) {
    return (
      <div className="ecom-app-product-list-page-empty-state-wrap-box">
        <p className="ecom-app-prod-list-page-empty-state-msg-text-line">
          No products found for now.
        </p>
      </div>
    );
  }

  return (
    <ul className="ecom-app-product-list-page-product-grid-list-box">
      {productCatalogListValue.map((productCatalogItemObjectValue) => (
        <li
          key={productCatalogItemObjectValue.id}
          className="ecom-app-prod-list-page-prod-grid-list-item-box"
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
