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

// I make this function for CheckoutFlowPage logic here.
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
        <div className="ecom-app-check-page-auth-req-state-wrap-box">
          <p className="ecom-app-check-page-auth-req-state-msg-text-line">
            You need login first before checkout and cart actions.
          </p>
          <Link
            className="ecom-app-check-page-auth-req-state-goto-log-575435"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      isShoppingCartTrackingRequestLoadingState ? (
        <div className="ecom-app-checkout-page-loading-state-wrap-box">
          <p className="ecom-app-checkout-page-loading-state-msg-text-line">
            Loading current active cart items now...
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isShoppingCartTrackingRequestLoadingState &&
      shoppingCartTrackingRequestErrorMessageState ? (
        <div className="ecom-app-checkout-page-error-state-wrap-box">
          <p className="ecom-app-checkout-page-error-state-msg-text-line">
            {shoppingCartTrackingRequestErrorMessageState}
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isShoppingCartTrackingRequestLoadingState &&
      !shoppingCartTrackingRequestErrorMessageState &&
      !currentActiveCartItemsListState.length ? (
        <div className="ecom-app-checkout-page-empty-state-wrap-box">
          <p className="ecom-app-checkout-page-empty-state-msg-text-line">
            Current cart is empty. Add item from product details page first.
          </p>
          <Link
            className="ecom-app-check-page-empty-state-goto-produc-cc2bb9"
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
        <div className="ecom-app-checkout-page-main-layout-wrap-box">
          <ul className="ecom-app-checkout-page-active-cart-items-list-box">
            {currentActiveCartItemsListState.map(
              (currentActiveCartItemObjectValue) => (
                <li
                  className="ecom-app-check-page-actv-cart-items-list-item-box"
                  key={currentActiveCartItemObjectValue.productIdValue}
                >
                  <article className="ecom-app-checkout-page-active-cart-item-card-box">
                    <h3 className="ecom-app-check-page-actv-cart-item-card-title-text">
                      {currentActiveCartItemObjectValue.productNameValue}
                    </h3>
                    <p className="ecom-app-check-page-actv-cart-item-card-des-102d6b">
                      {currentActiveCartItemObjectValue.productDescriptionValue}
                    </p>
                    <p className="ecom-app-check-page-actv-cart-item-card-qty-a5921f">
                      Quantity:
                      {" "}
                      {currentActiveCartItemObjectValue.quantityValue}
                    </p>
                    <button
                      className="ecom-app-check-page-actv-cart-item-card-rem-32d064"
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

          <div className="ecom-app-check-page-actv-cart-sum-card-wrap-box">
            <p className="ecom-app-check-page-actv-cart-sum-card-tota-861af3">
              Current cart total quantity:
              {" "}
              {currentActiveCartTotalQuantityState}
            </p>
            <p className="ecom-app-check-page-actv-cart-sum-card-tota-712d79">
              Current known total price:
              {" "}
              {Number.isFinite(currentActiveCartKnownTotalPriceAmountValue)
                ? `$${currentActiveCartKnownTotalPriceAmountValue.toFixed(2)}`
                : "Not available"}
            </p>

            {checkoutStripePaymentIntentSummaryPayloadState
              ?.stripePaymentAmountDisplayTextValue ? (
                <p className="ecom-app-check-page-actv-cart-sum-card-stri-45c368">
                  Stripe charge amount:
                  {" "}
                  {
                    checkoutStripePaymentIntentSummaryPayloadState.stripePaymentAmountDisplayTextValue
                  }
                </p>
              ) : null}

            {isCheckoutStripePaymentIntentCreateRequestLoadingState ? (
              <p className="ecom-app-check-page-actv-cart-sum-card-inte-bde86d">
                Preparing secure Stripe payment form...
              </p>
            ) : null}

            {checkoutStripePaymentIntentCreateRequestErrorMessageState ? (
              <p className="ecom-app-check-page-actv-cart-sum-card-inte-48c738">
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
        <p className="ecom-app-check-page-remove-item-action-fb-m-a58eff">
          {checkoutRemoveItemActionMessageState}
        </p>
      ) : null}

      {checkoutStripePaymentFlowFeedbackMessageState ? (
        <p className="ecom-app-check-page-stripe-payment-flow-fb--99375d">
          {checkoutStripePaymentFlowFeedbackMessageState}
        </p>
      ) : null}

      {checkoutPaidOrderSuccessMessageState ? (
        <div className="ecom-app-check-page-paid-ord-fb-box-wrap-box">
          <p className="ecom-app-check-page-paid-ord-fb-msg-text-line">
            {checkoutPaidOrderSuccessMessageState}
          </p>
          <Link
            className="ecom-app-check-page-paid-ord-fb-open-orders-92cd2e"
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
