import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import ApplicationProductDetailsInformationForDetailsPage from "../components/ApplicationProductDetailsInformationForDetailsPage";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { useApplicationShoppingCartTrackingContext } from "../context/ApplicationShoppingCartTrackingContextProvider";
import { fetchSingleProductDetailsByIdRequest } from "../services/applicationProductCatalogHttpService";

// I make this function for ProductDetailsPage logic here.
function ProductDetailsPage() {
  const { productId } = useParams();
  const productDetailsPageCurrentLocationObject = useLocation();
  const navigate = useNavigate();
  const [productDetailsPayloadState, setProductDetailsPayloadState] = useState(null);
  const [isProductDetailsRequestLoadingState, setIsProductDetailsRequestLoadingState] =
    useState(true);
  const [productDetailsRequestErrorMessageState, setProductDetailsRequestErrorMessageState] =
    useState("");
  const [isAddProductToCartActionLoadingState, setIsAddProductToCartActionLoadingState] =
    useState(false);
  const [addProductToCartActionMessageState, setAddProductToCartActionMessageState] =
    useState("");
  const { isAuthenticatedSessionActiveStateValue } =
    useApplicationAuthenticationSessionContext();
  const { addProductItemIntoCurrentActiveCartFromBackendAction } =
    useApplicationShoppingCartTrackingContext();

  // I make this function for loadSingleProductDetailsFromBackendAction logic here.
  const loadSingleProductDetailsFromBackendAction = async () => {
    try {
      setIsProductDetailsRequestLoadingState(true);
      setProductDetailsRequestErrorMessageState("");
      setAddProductToCartActionMessageState("");

      const singleProductDetailsResponseData =
        await fetchSingleProductDetailsByIdRequest(productId);
      setProductDetailsPayloadState(singleProductDetailsResponseData.product || null);
    } catch (error) {
      setProductDetailsRequestErrorMessageState(
        error.message || "Product details request failed."
      );
      setProductDetailsPayloadState(null);
    } finally {
      setIsProductDetailsRequestLoadingState(false);
    }
  };

  // I make this function for handleAddCurrentProductToCurrentActiveCartByApiAction logic here.
  const handleAddCurrentProductToCurrentActiveCartByApiAction = async () => {
    if (!productDetailsPayloadState) {
      return;
    }

    if (!isAuthenticatedSessionActiveStateValue) {
      navigate("/login", {
        state: {
          redirectAfterLoginPathValue:
            `${productDetailsPageCurrentLocationObject.pathname}${productDetailsPageCurrentLocationObject.search}`
        }
      });
      return;
    }

    try {
      setIsAddProductToCartActionLoadingState(true);

      const updatedCurrentActiveCartResponsePayloadObjectValue =
        await addProductItemIntoCurrentActiveCartFromBackendAction({
          productIdValue: productDetailsPayloadState.id,
          quantityValue: 1
        });

      setAddProductToCartActionMessageState(
        `Item added to current cart. Cart total items now: ${updatedCurrentActiveCartResponsePayloadObjectValue.currentActiveCartTotalQuantityValue}`
      );
    } catch (error) {
      if (error.httpStatusCodeValue === 401) {
        navigate("/login", {
          state: {
            redirectAfterLoginPathValue:
              `${productDetailsPageCurrentLocationObject.pathname}${productDetailsPageCurrentLocationObject.search}`
          }
        });
        return;
      }

      setAddProductToCartActionMessageState(
        error.message || "Cannot add product to cart now."
      );
    } finally {
      setIsAddProductToCartActionLoadingState(false);
    }
  };

  useEffect(() => {
    // Every time product id in route changes, I load new details data from backend.
    loadSingleProductDetailsFromBackendAction();
  }, [productId]);

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue={`Product Details for Item #${productId}`}
      pageDescriptionTextValue="Open one product and see more information before adding it to cart."
    >
      <Link
        className="ecom-app-prod-det-page-back-to-listing-link-btn-el"
        to="/products"
      >
        Back to Products Listing
      </Link>

      {isProductDetailsRequestLoadingState ? (
        <div className="ecom-app-prod-det-page-load-state-wrap-box">
          <p className="ecom-app-prod-det-page-load-state-msg-text-line">
            Loading product details now...
          </p>
        </div>
      ) : null}

      {productDetailsRequestErrorMessageState ? (
        <div className="ecom-app-product-details-page-error-state-wrap-box">
          <p className="ecom-app-prod-det-page-error-state-msg-text-line">
            {productDetailsRequestErrorMessageState}
          </p>
          <button
            className="ecom-app-prod-det-page-error-retry-btn-el"
            type="button"
            onClick={loadSingleProductDetailsFromBackendAction}
          >
            Retry Loading Details
          </button>
        </div>
      ) : null}

      {!isProductDetailsRequestLoadingState &&
      !productDetailsRequestErrorMessageState &&
      productDetailsPayloadState ? (
        <div className="ecom-app-product-details-page-main-layout-wrap-box">
          <ApplicationProductDetailsInformationForDetailsPage
            productDetailsPayloadObjectValue={productDetailsPayloadState}
          />

          <div className="ecom-app-prod-det-page-add-to-cart-action-wrap-box">
            <button
              className="ecom-app-prod-det-page-add-item-to-cart-btn-el"
              type="button"
              onClick={handleAddCurrentProductToCurrentActiveCartByApiAction}
              disabled={isAddProductToCartActionLoadingState}
            >
              {isAddProductToCartActionLoadingState
                ? "Adding to cart..."
                : "Add Item to Cart"}
            </button>

            {addProductToCartActionMessageState ? (
              <p className="ecom-app-prod-det-page-add-to-cart-fb-msg-text">
                {addProductToCartActionMessageState}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isProductDetailsRequestLoadingState &&
      !productDetailsRequestErrorMessageState &&
      !productDetailsPayloadState ? (
        <div className="ecom-app-product-details-page-empty-state-wrap-box">
          <p className="ecom-app-prod-det-page-empty-state-msg-text-line">
            Product details not found for this id.
          </p>
        </div>
      ) : null}
    </ApplicationSimplePageTemplateLayout>
  );
}

export default ProductDetailsPage;
