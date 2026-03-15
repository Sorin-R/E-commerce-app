import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import ApplicationCheckoutStripePaymentForm from "../components/ApplicationCheckoutStripePaymentForm";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { useApplicationShoppingCartTrackingContext } from "../context/ApplicationShoppingCartTrackingContextProvider";
import { createStripePaymentIntentForCurrentActiveCartRequest } from "../services/applicationCheckoutPaymentHttpService";

const stripePublishableKeyValue =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripeClientPromiseObjectValue = stripePublishableKeyValue
  ? loadStripe(stripePublishableKeyValue)
  : null;

function CheckoutFlowPage() {
  const { isAuthenticatedSessionActiveStateValue } =
    useApplicationAuthenticationSessionContext();
  const {
    currentActiveCartItemsListState,
    currentActiveCartTotalQuantityState,
    isShoppingCartTrackingRequestLoadingState,
    shoppingCartTrackingRequestErrorMessageState,
    deleteProductItemFromCurrentActiveCartByIdFromBackendAction,
    refreshCurrentActiveCartItemsFromBackendAction
  } = useApplicationShoppingCartTrackingContext();
  const [
    checkoutRemoveItemActionMessageState,
    setCheckoutRemoveItemActionMessageState
  ] = useState("");
  const [
    checkoutStripePaymentFlowFeedbackMessageState,
    setCheckoutStripePaymentFlowFeedbackMessageState
  ] = useState("");
  const [
    checkoutPaidOrderSuccessMessageState,
    setCheckoutPaidOrderSuccessMessageState
  ] = useState("");
  const [
    isCheckoutStripePaymentIntentCreateRequestLoadingState,
    setIsCheckoutStripePaymentIntentCreateRequestLoadingState
  ] = useState(false);
  const [
    checkoutStripePaymentIntentCreateRequestErrorMessageState,
    setCheckoutStripePaymentIntentCreateRequestErrorMessageState
  ] = useState("");
  const [
    checkoutStripePaymentIntentClientSecretState,
    setCheckoutStripePaymentIntentClientSecretState
  ] = useState("");
  const [
    checkoutStripePaymentIntentSummaryPayloadState,
    setCheckoutStripePaymentIntentSummaryPayloadState
  ] = useState(null);
  const [
    checkoutRemoveItemRequestLoadingProductIdStateValue,
    setCheckoutRemoveItemRequestLoadingProductIdStateValue
  ] = useState(null);

  const currentActiveCartKnownTotalPriceAmountValue = useMemo(
    () =>
      currentActiveCartItemsListState.reduce(
        (
          runningCurrentActiveCartKnownTotalPriceAmountValue,
          currentActiveCartItemObjectValue
        ) => {
          if (
            typeof currentActiveCartItemObjectValue.productUnitPriceAmountValue !==
            "number"
          ) {
            return runningCurrentActiveCartKnownTotalPriceAmountValue;
          }

          return (
            runningCurrentActiveCartKnownTotalPriceAmountValue +
            currentActiveCartItemObjectValue.productUnitPriceAmountValue *
              Number(currentActiveCartItemObjectValue.quantityValue || 0)
          );
        },
        0
      ),
    [currentActiveCartItemsListState]
  );

  const handleRemoveProductItemFromCurrentActiveCartAction = async (
    productIdValue
  ) => {
    try {
      setCheckoutRemoveItemRequestLoadingProductIdStateValue(productIdValue);
      setCheckoutRemoveItemActionMessageState("");
      setCheckoutStripePaymentFlowFeedbackMessageState("");
      setCheckoutPaidOrderSuccessMessageState("");

      await deleteProductItemFromCurrentActiveCartByIdFromBackendAction(
        productIdValue
      );
      setCheckoutRemoveItemActionMessageState(
        "One product item is removed from current active cart."
      );
    } catch (error) {
      setCheckoutRemoveItemActionMessageState(
        error.message || "Cannot remove product item from current cart now."
      );
    } finally {
      setCheckoutRemoveItemRequestLoadingProductIdStateValue(null);
    }
  };

  const handlePaidCheckoutOrderCompletedSuccessfullyAction = async (
    completePaidCurrentActiveCartIntoPastOrderResponsePayloadObjectValue
  ) => {
    const completedOrderTrackingIdValue =
      completePaidCurrentActiveCartIntoPastOrderResponsePayloadObjectValue
        ?.completedOrderHistoryGroupPayloadObjectValue
        ?.completedOrderTrackingIdValue;

    setCheckoutPaidOrderSuccessMessageState(
      completedOrderTrackingIdValue
        ? `Payment successful and order completed. Order id: ${completedOrderTrackingIdValue}`
        : "Payment successful and order completed."
    );
    setCheckoutStripePaymentFlowFeedbackMessageState("");
    setCheckoutStripePaymentIntentClientSecretState("");
    setCheckoutStripePaymentIntentSummaryPayloadState(null);
    setCheckoutStripePaymentIntentCreateRequestErrorMessageState("");

    // After payment completed, I refresh cart so navbar and checkout show latest empty cart state.
    await refreshCurrentActiveCartItemsFromBackendAction();
  };

  useEffect(() => {
    if (!isAuthenticatedSessionActiveStateValue) {
      setCheckoutStripePaymentIntentClientSecretState("");
      setCheckoutStripePaymentIntentCreateRequestErrorMessageState("");
      setCheckoutStripePaymentIntentSummaryPayloadState(null);
      return;
    }

    if (isShoppingCartTrackingRequestLoadingState) {
      return;
    }

    if (!currentActiveCartItemsListState.length) {
      setCheckoutStripePaymentIntentClientSecretState("");
      setCheckoutStripePaymentIntentCreateRequestErrorMessageState("");
      setCheckoutStripePaymentIntentSummaryPayloadState(null);
      return;
    }

    if (!stripePublishableKeyValue || !stripeClientPromiseObjectValue) {
      setCheckoutStripePaymentIntentClientSecretState("");
      setCheckoutStripePaymentIntentSummaryPayloadState(null);
      setCheckoutStripePaymentIntentCreateRequestErrorMessageState(
        "Stripe publishable key is missing in frontend environment configuration."
      );
      return;
    }

    const createStripePaymentIntentForCurrentActiveCartAsyncAction =
      async () => {
        try {
          setIsCheckoutStripePaymentIntentCreateRequestLoadingState(true);
          setCheckoutStripePaymentIntentCreateRequestErrorMessageState("");
          setCheckoutStripePaymentFlowFeedbackMessageState("");

          const createStripePaymentIntentResponsePayloadObjectValue =
            await createStripePaymentIntentForCurrentActiveCartRequest();

          setCheckoutStripePaymentIntentClientSecretState(
            createStripePaymentIntentResponsePayloadObjectValue.stripePaymentClientSecretValue ||
              ""
          );
          setCheckoutStripePaymentIntentSummaryPayloadState(
            createStripePaymentIntentResponsePayloadObjectValue
          );
        } catch (error) {
          setCheckoutStripePaymentIntentClientSecretState("");
          setCheckoutStripePaymentIntentSummaryPayloadState(null);
          setCheckoutStripePaymentIntentCreateRequestErrorMessageState(
            error.message || "Cannot create stripe payment intent now."
          );
        } finally {
          setIsCheckoutStripePaymentIntentCreateRequestLoadingState(false);
        }
      };

    // Cart can change when user removes item, so I recreate intent to keep amount synced.
    createStripePaymentIntentForCurrentActiveCartAsyncAction();
  }, [
    isAuthenticatedSessionActiveStateValue,
    isShoppingCartTrackingRequestLoadingState,
    currentActiveCartItemsListState
  ]);

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Checkout Flow"
      pageDescriptionTextValue="Review current cart items, pay with Stripe, and complete your purchase."
    >
      {!isAuthenticatedSessionActiveStateValue ? (
        <div className="ecommerce-application-checkout-flow-page-auth-required-state-wrapper-container">
          <p className="ecommerce-application-checkout-flow-page-auth-required-state-message-text-line">
            You need login first before checkout and cart actions.
          </p>
          <Link
            className="ecommerce-application-checkout-flow-page-auth-required-state-go-to-login-link-button-element"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      isShoppingCartTrackingRequestLoadingState ? (
        <div className="ecommerce-application-checkout-flow-page-loading-state-wrapper-container">
          <p className="ecommerce-application-checkout-flow-page-loading-state-message-text-line">
            Loading current active cart items now...
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isShoppingCartTrackingRequestLoadingState &&
      shoppingCartTrackingRequestErrorMessageState ? (
        <div className="ecommerce-application-checkout-flow-page-error-state-wrapper-container">
          <p className="ecommerce-application-checkout-flow-page-error-state-message-text-line">
            {shoppingCartTrackingRequestErrorMessageState}
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isShoppingCartTrackingRequestLoadingState &&
      !shoppingCartTrackingRequestErrorMessageState &&
      !currentActiveCartItemsListState.length ? (
        <div className="ecommerce-application-checkout-flow-page-empty-state-wrapper-container">
          <p className="ecommerce-application-checkout-flow-page-empty-state-message-text-line">
            Current cart is empty. Add item from product details page first.
          </p>
          <Link
            className="ecommerce-application-checkout-flow-page-empty-state-go-to-products-link-button-element"
            to="/products"
          >
            Open Products
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isShoppingCartTrackingRequestLoadingState &&
      !shoppingCartTrackingRequestErrorMessageState &&
      currentActiveCartItemsListState.length ? (
        <div className="ecommerce-application-checkout-flow-page-main-layout-wrapper-container">
          <ul className="ecommerce-application-checkout-flow-page-current-active-cart-items-list-container">
            {currentActiveCartItemsListState.map(
              (currentActiveCartItemObjectValue) => (
                <li
                  className="ecommerce-application-checkout-flow-page-current-active-cart-items-list-item-container"
                  key={currentActiveCartItemObjectValue.productIdValue}
                >
                  <article className="ecommerce-application-checkout-flow-page-current-active-cart-item-card-container">
                    <h3 className="ecommerce-application-checkout-flow-page-current-active-cart-item-card-title-text">
                      {currentActiveCartItemObjectValue.productNameValue}
                    </h3>
                    <p className="ecommerce-application-checkout-flow-page-current-active-cart-item-card-description-text-line">
                      {currentActiveCartItemObjectValue.productDescriptionValue}
                    </p>
                    <p className="ecommerce-application-checkout-flow-page-current-active-cart-item-card-quantity-text-line">
                      Quantity:
                      {" "}
                      {currentActiveCartItemObjectValue.quantityValue}
                    </p>
                    <button
                      className="ecommerce-application-checkout-flow-page-current-active-cart-item-card-remove-item-button-element"
                      type="button"
                      onClick={() =>
                        handleRemoveProductItemFromCurrentActiveCartAction(
                          currentActiveCartItemObjectValue.productIdValue
                        )
                      }
                      disabled={
                        checkoutRemoveItemRequestLoadingProductIdStateValue ===
                        currentActiveCartItemObjectValue.productIdValue
                      }
                    >
                      {checkoutRemoveItemRequestLoadingProductIdStateValue ===
                      currentActiveCartItemObjectValue.productIdValue
                        ? "Removing..."
                        : "Remove Item"}
                    </button>
                  </article>
                </li>
              )
            )}
          </ul>

          <div className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-wrapper-container">
            <p className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-total-items-text-line">
              Current cart total quantity:
              {" "}
              {currentActiveCartTotalQuantityState}
            </p>
            <p className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-total-price-text-line">
              Current known total price:
              {" "}
              {Number.isFinite(currentActiveCartKnownTotalPriceAmountValue)
                ? `$${currentActiveCartKnownTotalPriceAmountValue.toFixed(2)}`
                : "Not available"}
            </p>

            {checkoutStripePaymentIntentSummaryPayloadState
              ?.stripePaymentAmountDisplayTextValue ? (
                <p className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-stripe-amount-text-line">
                  Stripe charge amount:
                  {" "}
                  {
                    checkoutStripePaymentIntentSummaryPayloadState.stripePaymentAmountDisplayTextValue
                  }
                </p>
              ) : null}

            {isCheckoutStripePaymentIntentCreateRequestLoadingState ? (
              <p className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-create-intent-loading-message-text-line">
                Preparing secure Stripe payment form...
              </p>
            ) : null}

            {checkoutStripePaymentIntentCreateRequestErrorMessageState ? (
              <p className="ecommerce-application-checkout-flow-page-current-active-cart-summary-card-create-intent-error-message-text-line">
                {checkoutStripePaymentIntentCreateRequestErrorMessageState}
              </p>
            ) : null}

            {!isCheckoutStripePaymentIntentCreateRequestLoadingState &&
            !checkoutStripePaymentIntentCreateRequestErrorMessageState &&
            checkoutStripePaymentIntentClientSecretState &&
            stripeClientPromiseObjectValue ? (
              <Elements
                key={checkoutStripePaymentIntentClientSecretState}
                stripe={stripeClientPromiseObjectValue}
                options={{
                  clientSecret: checkoutStripePaymentIntentClientSecretState
                }}
              >
                <ApplicationCheckoutStripePaymentForm
                  onPaidCheckoutOrderCompletedSuccessfullyAction={
                    handlePaidCheckoutOrderCompletedSuccessfullyAction
                  }
                  onCheckoutStripePaymentFlowFeedbackMessageChangeAction={
                    setCheckoutStripePaymentFlowFeedbackMessageState
                  }
                />
              </Elements>
            ) : null}
          </div>
        </div>
      ) : null}

      {checkoutRemoveItemActionMessageState ? (
        <p className="ecommerce-application-checkout-flow-page-remove-item-action-feedback-message-text-line">
          {checkoutRemoveItemActionMessageState}
        </p>
      ) : null}

      {checkoutStripePaymentFlowFeedbackMessageState ? (
        <p className="ecommerce-application-checkout-flow-page-stripe-payment-flow-feedback-message-text-line">
          {checkoutStripePaymentFlowFeedbackMessageState}
        </p>
      ) : null}

      {checkoutPaidOrderSuccessMessageState ? (
        <div className="ecommerce-application-checkout-flow-page-paid-order-success-feedback-box-wrapper-container">
          <p className="ecommerce-application-checkout-flow-page-paid-order-success-feedback-message-text-line">
            {checkoutPaidOrderSuccessMessageState}
          </p>
          <Link
            className="ecommerce-application-checkout-flow-page-paid-order-success-feedback-open-order-history-link-button-element"
            to="/order-history"
          >
            Open Order History
          </Link>
        </div>
      ) : null}
    </ApplicationSimplePageTemplateLayout>
  );
}

export default CheckoutFlowPage;
