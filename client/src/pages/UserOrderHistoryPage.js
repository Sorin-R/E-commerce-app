import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { getPastCompletedOrderHistoryGroupListRequest } from "../services/applicationShoppingCartHttpService";

// I make this function for UserOrderHistoryPage logic here.
function UserOrderHistoryPage() {
  const { isAuthenticatedSessionActiveStateValue } =
    useApplicationAuthenticationSessionContext();
  const userOrderHistoryPageCurrentLocationObject = useLocation();
  const navigate = useNavigate();
  const [isOrderHistoryRequestLoadingState, setIsOrderHistoryRequestLoadingState] =
    useState(false);
  const [orderHistoryRequestErrorMessageState, setOrderHistoryRequestErrorMessageState] =
    useState("");
  const [pastCompletedOrderHistoryGroupListState, setPastCompletedOrderHistoryGroupListState] =
    useState([]);

  const loadPastCompletedOrderHistoryFromBackendAction = useCallback(
    async () => {
      if (!isAuthenticatedSessionActiveStateValue) {
        setPastCompletedOrderHistoryGroupListState([]);
        setOrderHistoryRequestErrorMessageState("");
        return;
      }

      try {
        setIsOrderHistoryRequestLoadingState(true);
        setOrderHistoryRequestErrorMessageState("");

        const pastCompletedOrderHistoryResponsePayloadObjectValue =
          await getPastCompletedOrderHistoryGroupListRequest();
        setPastCompletedOrderHistoryGroupListState(
          pastCompletedOrderHistoryResponsePayloadObjectValue.pastCompletedOrderHistoryGroupListValue ||
            []
        );
      } catch (error) {
        if (error.httpStatusCodeValue === 401) {
          navigate("/login", {
            replace: true,
            state: {
              redirectAfterLoginPathValue:
                `${userOrderHistoryPageCurrentLocationObject.pathname}${userOrderHistoryPageCurrentLocationObject.search}`
            }
          });
          return;
        }

        setOrderHistoryRequestErrorMessageState(
          error.message || "Past completed order history request failed."
        );
      } finally {
        setIsOrderHistoryRequestLoadingState(false);
      }
    },
    [
      isAuthenticatedSessionActiveStateValue,
      navigate,
      userOrderHistoryPageCurrentLocationObject.pathname,
      userOrderHistoryPageCurrentLocationObject.search
    ]
  );

  useEffect(() => {
    // When page opens, I load full order history list from protected backend endpoint.
    loadPastCompletedOrderHistoryFromBackendAction();
  }, [loadPastCompletedOrderHistoryFromBackendAction]);

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Order History"
      pageDescriptionTextValue="See your completed orders, status values, and purchased item details."
    >
      <div className="ecom-app-order-history-page-top-actions-wrap-box">
        <button
          className="ecom-app-ord-hist-page-top-actions-refresh-btn"
          type="button"
          onClick={loadPastCompletedOrderHistoryFromBackendAction}
          disabled={isOrderHistoryRequestLoadingState}
        >
          {isOrderHistoryRequestLoadingState
            ? "Refreshing Order History..."
            : "Refresh Order History"}
        </button>
      </div>

      {!isAuthenticatedSessionActiveStateValue ? (
        <div className="ecom-app-ord-hist-page-auth-req-state-wrap-box">
          <p className="ecom-app-ord-hist-page-auth-req-msg-text-line">
            Please login first to see order history.
          </p>
          <Link
            className="ecom-app-ord-hist-page-auth-req-goto-login-link"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      isOrderHistoryRequestLoadingState ? (
        <div className="ecom-app-order-history-page-loading-state-wrap-box">
          <p className="ecom-app-ord-hist-page-load-state-msg-text-line">
            Loading past completed order history now...
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isOrderHistoryRequestLoadingState &&
      orderHistoryRequestErrorMessageState ? (
        <div className="ecom-app-order-history-page-error-state-wrap-box">
          <p className="ecom-app-ord-hist-page-error-state-msg-text-line">
            {orderHistoryRequestErrorMessageState}
          </p>
          <button
            className="ecom-app-ord-hist-page-error-retry-btn-el"
            type="button"
            onClick={loadPastCompletedOrderHistoryFromBackendAction}
          >
            Retry Loading Order History
          </button>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isOrderHistoryRequestLoadingState &&
      !orderHistoryRequestErrorMessageState &&
      !pastCompletedOrderHistoryGroupListState.length ? (
        <div className="ecom-app-order-history-page-empty-state-wrap-box">
          <p className="ecom-app-ord-hist-page-empty-state-msg-text-line">
            You do not have past completed orders now.
          </p>
          <Link
            className="ecom-app-ord-hist-page-empty-goto-checkout-link"
            to="/checkout"
          >
            Open Checkout
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isOrderHistoryRequestLoadingState &&
      !orderHistoryRequestErrorMessageState &&
      pastCompletedOrderHistoryGroupListState.length ? (
        <ul className="ecom-app-order-history-page-order-group-list-box">
          {pastCompletedOrderHistoryGroupListState.map(
            (completedOrderHistoryGroupObjectValue) => {
              const orderCurrencyCodeValue = findOrderCurrencyCodeTextValue(
                completedOrderHistoryGroupObjectValue
              );

              return (
                <li
                  className="ecom-app-ord-hist-page-ord-group-list-item-box"
                  key={
                    completedOrderHistoryGroupObjectValue.completedOrderTrackingIdValue
                  }
                >
                  <article className="ecom-app-order-history-page-order-card-box">
                    <h3 className="ecom-app-ord-hist-page-card-tracking-text">
                      Order ID:
                      {" "}
                      {
                        completedOrderHistoryGroupObjectValue.completedOrderTrackingIdValue
                      }
                    </h3>

                    <p
                      className={buildOrderStatusBadgeClassNameTextValue(
                        completedOrderHistoryGroupObjectValue.completedOrderStatusTextValue
                      )}
                    >
                      Status:
                      {" "}
                      {
                        completedOrderHistoryGroupObjectValue.completedOrderStatusTextValue
                      }
                    </p>
                    <p className="ecom-app-ord-hist-page-card-created-date-text">
                      Created At:
                      {" "}
                      {new Date(
                        completedOrderHistoryGroupObjectValue.completedOrderCreatedAtIsoDateTextValue
                      ).toLocaleString()}
                    </p>
                    <p className="ecom-app-ord-hist-page-card-total-qty-text">
                      Total Purchased Items:
                      {" "}
                      {completedOrderHistoryGroupObjectValue.completedOrderTotalQuantityValue ||
                        0}
                    </p>
                    <p className="ecom-app-ord-hist-page-card-total-price-text">
                      Total Known Price:
                      {" "}
                      {formatOrderCurrencyAmountTextValue({
                        amountNumberValue:
                          completedOrderHistoryGroupObjectValue.completedOrderKnownTotalPriceAmountValue ||
                          0,
                        currencyCodeTextValue: orderCurrencyCodeValue
                      })}
                    </p>

                    {completedOrderHistoryGroupObjectValue
                      .completedOrderPaymentDetailsObjectValue ? (
                        <div className="ecom-app-ord-hist-page-card-payment-wrap-box">
                          <p className="ecom-app-ord-hist-page-card-payment-provider-text">
                            Payment Provider:
                            {" "}
                            {completedOrderHistoryGroupObjectValue.completedOrderPaymentDetailsObjectValue.paymentProviderNameValue}
                          </p>
                          <p className="ecom-app-ord-hist-page-card-payment-txn-text">
                            Transaction ID:
                            {" "}
                            {completedOrderHistoryGroupObjectValue.completedOrderPaymentDetailsObjectValue.stripePaymentIntentIdValue}
                          </p>
                        </div>
                      ) : null}

                    <ul className="ecom-app-ord-hist-page-ord-card-items-list-box">
                      {(
                        completedOrderHistoryGroupObjectValue.completedOrderItemsListValue ||
                        []
                      ).map((completedOrderItemObjectValue) => {
                        const orderItemUnitPriceAmountValue =
                          typeof completedOrderItemObjectValue.productUnitPriceAmountValue ===
                          "number"
                            ? completedOrderItemObjectValue.productUnitPriceAmountValue
                            : 0;
                        const orderItemQuantityValue = Number(
                          completedOrderItemObjectValue.quantityValue || 0
                        );
                        const orderItemTotalPriceAmountValue =
                          orderItemUnitPriceAmountValue * orderItemQuantityValue;

                        return (
                          <li
                            className="ecom-app-ord-hist-page-card-item-wrap-box"
                            key={`${completedOrderHistoryGroupObjectValue.completedOrderTrackingIdValue}_${completedOrderItemObjectValue.productIdValue}`}
                          >
                            <p className="ecom-app-ord-hist-page-card-item-name-text">
                              {completedOrderItemObjectValue.productNameValue}
                            </p>
                            <p className="ecom-app-ord-hist-page-card-item-desc-text">
                              {completedOrderItemObjectValue.productDescriptionValue ||
                                "No item description available for this purchased product."}
                            </p>
                            <p className="ecom-app-ord-hist-page-ord-card-item-qty-text-line">
                              Quantity:
                              {" "}
                              {orderItemQuantityValue}
                            </p>
                            <p className="ecom-app-ord-hist-page-card-item-unit-price-text">
                              Unit Price:
                              {" "}
                              {formatOrderCurrencyAmountTextValue({
                                amountNumberValue: orderItemUnitPriceAmountValue,
                                currencyCodeTextValue: orderCurrencyCodeValue
                              })}
                            </p>
                            <p className="ecom-app-ord-hist-page-card-item-total-text">
                              Item Total:
                              {" "}
                              {formatOrderCurrencyAmountTextValue({
                                amountNumberValue: orderItemTotalPriceAmountValue,
                                currencyCodeTextValue: orderCurrencyCodeValue
                              })}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              );
            }
          )}
        </ul>
      ) : null}
    </ApplicationSimplePageTemplateLayout>
  );
}

export default UserOrderHistoryPage;

// I make this function for findOrderCurrencyCodeTextValue logic here.
function findOrderCurrencyCodeTextValue(completedOrderHistoryGroupObjectValue) {
  const paymentDetailsCurrencyCodeTextValue =
    completedOrderHistoryGroupObjectValue?.completedOrderPaymentDetailsObjectValue?.stripeCurrencyCodeValue;

  if (paymentDetailsCurrencyCodeTextValue) {
    return String(paymentDetailsCurrencyCodeTextValue).toUpperCase();
  }

  const firstCompletedOrderItemWithCurrencyCodeObjectValue = (
    completedOrderHistoryGroupObjectValue?.completedOrderItemsListValue || []
  ).find((completedOrderItemObjectValue) =>
    completedOrderItemObjectValue.productCurrencyCodeValue
  );

  if (firstCompletedOrderItemWithCurrencyCodeObjectValue?.productCurrencyCodeValue) {
    return String(
      firstCompletedOrderItemWithCurrencyCodeObjectValue.productCurrencyCodeValue
    ).toUpperCase();
  }

  return "USD";
}

// I make this function for formatOrderCurrencyAmountTextValue logic here.
function formatOrderCurrencyAmountTextValue({
  amountNumberValue,
  currencyCodeTextValue
}) {
  const normalizedAmountNumberValue = Number(amountNumberValue || 0);
  return `${currencyCodeTextValue} ${normalizedAmountNumberValue.toFixed(2)}`;
}

// I make this function for buildOrderStatusBadgeClassNameTextValue logic here.
function buildOrderStatusBadgeClassNameTextValue(completedOrderStatusTextValue) {
  const normalizedCompletedOrderStatusTextValue = String(
    completedOrderStatusTextValue || "UNKNOWN"
  )
    .toUpperCase()
    .trim();

  if (normalizedCompletedOrderStatusTextValue === "PAID") {
    return "ecom-app-ord-hist-page-card-status-base ecom-app-ord-hist-page-card-status-paid";
  }

  if (normalizedCompletedOrderStatusTextValue === "COMPLETED") {
    return "ecom-app-ord-hist-page-card-status-base ecom-app-ord-hist-page-card-status-done";
  }

  return "ecom-app-ord-hist-page-card-status-base ecom-app-ord-hist-page-card-status-unknown";
}
