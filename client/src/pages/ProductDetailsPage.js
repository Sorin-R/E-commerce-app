import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import ApplicationProductDetailsInformationForDetailsPage from "../components/ApplicationProductDetailsInformationForDetailsPage";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { useApplicationShoppingCartTrackingContext } from "../context/ApplicationShoppingCartTrackingContextProvider";
import { fetchSingleProductDetailsByIdRequest } from "../services/applicationProductCatalogHttpService";

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
        className="ecommerce-application-product-details-page-back-to-listing-link-button-element"
        to="/products"
      >
        Back to Products Listing
      </Link>

      {isProductDetailsRequestLoadingState ? (
        <div className="ecommerce-application-product-details-page-loading-state-wrapper-container">
          <p className="ecommerce-application-product-details-page-loading-state-message-text-line">
            Loading product details now...
          </p>
        </div>
      ) : null}

      {productDetailsRequestErrorMessageState ? (
        <div className="ecommerce-application-product-details-page-error-state-wrapper-container">
          <p className="ecommerce-application-product-details-page-error-state-message-text-line">
            {productDetailsRequestErrorMessageState}
          </p>
          <button
            className="ecommerce-application-product-details-page-error-state-retry-request-button-element"
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
        <div className="ecommerce-application-product-details-page-main-layout-wrapper-container">
          <ApplicationProductDetailsInformationForDetailsPage
            productDetailsPayloadObjectValue={productDetailsPayloadState}
          />

          <div className="ecommerce-application-product-details-page-add-to-cart-action-wrapper-container">
            <button
              className="ecommerce-application-product-details-page-add-item-to-cart-button-element"
              type="button"
              onClick={handleAddCurrentProductToCurrentActiveCartByApiAction}
              disabled={isAddProductToCartActionLoadingState}
            >
              {isAddProductToCartActionLoadingState
                ? "Adding to cart..."
                : "Add Item to Cart"}
            </button>

            {addProductToCartActionMessageState ? (
              <p className="ecommerce-application-product-details-page-add-to-cart-action-message-text-line">
                {addProductToCartActionMessageState}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isProductDetailsRequestLoadingState &&
      !productDetailsRequestErrorMessageState &&
      !productDetailsPayloadState ? (
        <div className="ecommerce-application-product-details-page-empty-state-wrapper-container">
          <p className="ecommerce-application-product-details-page-empty-state-message-text-line">
            Product details not found for this id.
          </p>
        </div>
      ) : null}
    </ApplicationSimplePageTemplateLayout>
  );
}

export default ProductDetailsPage;
