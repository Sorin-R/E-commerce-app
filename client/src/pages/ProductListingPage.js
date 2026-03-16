import { useEffect, useState } from "react";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import ApplicationProductListForListingPage from "../components/ApplicationProductListForListingPage";
import { fetchProductCatalogListRequest } from "../services/applicationProductCatalogHttpService";

// I make this function for ProductListingPage logic here.
function ProductListingPage() {
  const [productCatalogListState, setProductCatalogListState] = useState([]);
  const [isProductCatalogRequestLoadingState, setIsProductCatalogRequestLoadingState] =
    useState(true);
  const [productCatalogRequestErrorMessageState, setProductCatalogRequestErrorMessageState] =
    useState("");

  // I make this function for loadProductCatalogListFromBackendAction logic here.
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
        <div className="ecom-app-product-list-page-loading-state-wrap-box">
          <p className="ecom-app-prod-list-page-load-state-msg-text-line">
            Loading products now...
          </p>
        </div>
      ) : null}

      {productCatalogRequestErrorMessageState ? (
        <div className="ecom-app-product-list-page-error-state-wrap-box">
          <p className="ecom-app-prod-list-page-error-state-msg-text-line">
            {productCatalogRequestErrorMessageState}
          </p>
          <button
            className="ecom-app-prod-list-page-error-retry-btn-el"
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
