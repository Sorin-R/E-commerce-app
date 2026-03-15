import { useEffect, useState } from "react";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import ApplicationProductListForListingPage from "../components/ApplicationProductListForListingPage";
import { fetchProductCatalogListRequest } from "../services/applicationProductCatalogHttpService";

function ProductListingPage() {
  const [productCatalogListState, setProductCatalogListState] = useState([]);
  const [isProductCatalogRequestLoadingState, setIsProductCatalogRequestLoadingState] =
    useState(true);
  const [productCatalogRequestErrorMessageState, setProductCatalogRequestErrorMessageState] =
    useState("");

  const loadProductCatalogListFromBackendAction = async () => {
    try {
      setIsProductCatalogRequestLoadingState(true);
      setProductCatalogRequestErrorMessageState("");

      const productCatalogResponseData = await fetchProductCatalogListRequest();
      setProductCatalogListState(productCatalogResponseData.products || []);
    } catch (error) {
      setProductCatalogRequestErrorMessageState(
        error.message || "Product list request failed."
      );
      setProductCatalogListState([]);
    } finally {
      setIsProductCatalogRequestLoadingState(false);
    }
  };

  useEffect(() => {
    // On page load I call backend endpoint so user can browse products list.
    loadProductCatalogListFromBackendAction();
  }, []);

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Products Listing"
      pageDescriptionTextValue="User can browse products from here. Data is loaded from API endpoint."
    >
      {isProductCatalogRequestLoadingState ? (
        <div className="ecommerce-application-product-listing-page-loading-state-wrapper-container">
          <p className="ecommerce-application-product-listing-page-loading-state-message-text-line">
            Loading products now...
          </p>
        </div>
      ) : null}

      {productCatalogRequestErrorMessageState ? (
        <div className="ecommerce-application-product-listing-page-error-state-wrapper-container">
          <p className="ecommerce-application-product-listing-page-error-state-message-text-line">
            {productCatalogRequestErrorMessageState}
          </p>
          <button
            className="ecommerce-application-product-listing-page-error-state-retry-request-button-element"
            type="button"
            onClick={loadProductCatalogListFromBackendAction}
          >
            Retry Loading Products
          </button>
        </div>
      ) : null}

      {!isProductCatalogRequestLoadingState &&
      !productCatalogRequestErrorMessageState ? (
        <ApplicationProductListForListingPage
          productCatalogListValue={productCatalogListState}
        />
      ) : null}
    </ApplicationSimplePageTemplateLayout>
  );
}

export default ProductListingPage;
