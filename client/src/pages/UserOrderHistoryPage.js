import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { getPastCompletedOrderHistoryGroupListRequest } from "../services/applicationShoppingCartHttpService";

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
      <div className="ecommerce-application-user-order-history-page-top-actions-wrapper-container">
        <button
          className="ecommerce-application-user-order-history-page-top-actions-refresh-order-history-button-element"
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
        <div className="ecommerce-application-user-order-history-page-auth-required-state-wrapper-container">
          <p className="ecommerce-application-user-order-history-page-auth-required-state-message-text-line">
            Please login first to see order history.
          </p>
          <Link
            className="ecommerce-application-user-order-history-page-auth-required-state-go-to-login-link-button-element"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      isOrderHistoryRequestLoadingState ? (
        <div className="ecommerce-application-user-order-history-page-loading-state-wrapper-container">
          <p className="ecommerce-application-user-order-history-page-loading-state-message-text-line">
            Loading past completed order history now...
          </p>
        </div>
      ) : null}

      {isAuthenticatedSessionActiveStateValue &&
      !isOrderHistoryRequestLoadingState &&
      orderHistoryRequestErrorMessageState ? (
        <div className="ecommerce-application-user-order-history-page-error-state-wrapper-container">
          <p className="ecommerce-application-user-order-history-page-error-state-message-text-line">
            {orderHistoryRequestErrorMessageState}
          </p>
          <button
            className="ecommerce-application-user-order-history-page-error-state-retry-request-button-element"
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
        <div className="ecommerce-application-user-order-history-page-empty-state-wrapper-container">
          <p className="ecommerce-application-user-order-history-page-empty-state-message-text-line">
            You do not have past completed orders now.
          </p>
          <Link
            className="ecommerce-application-user-order-history-page-empty-state-go-to-checkout-link-button-element"
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
        <ul className="ecommerce-application-user-order-history-page-order-group-list-container">
          {pastCompletedOrderHistoryGroupListState.map(
            (completedOrderHistoryGroupObjectValue) => {
              const orderCurrencyCodeValue = findOrderCurrencyCodeTextValue(
                completedOrderHistoryGroupObjectValue
              );

              return (
                <li
                  className="ecommerce-application-user-order-history-page-order-group-list-item-container"
                  key={
                    completedOrderHistoryGroupObjectValue.completedOrderTrackingIdValue
                  }
                >
                  <article className="ecommerce-application-user-order-history-page-order-group-card-container">
                    <h3 className="ecommerce-application-user-order-history-page-order-group-card-tracking-id-text-line">
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
                    <p className="ecommerce-application-user-order-history-page-order-group-card-created-date-text-line">
                      Created At:
                      {" "}
                      {new Date(
                        completedOrderHistoryGroupObjectValue.completedOrderCreatedAtIsoDateTextValue
                      ).toLocaleString()}
                    </p>
                    <p className="ecommerce-application-user-order-history-page-order-group-card-total-quantity-text-line">
                      Total Purchased Items:
                      {" "}
                      {completedOrderHistoryGroupObjectValue.completedOrderTotalQuantityValue ||
                        0}
                    </p>
                    <p className="ecommerce-application-user-order-history-page-order-group-card-total-known-price-text-line">
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
                        <div className="ecommerce-application-user-order-history-page-order-group-card-payment-details-wrapper-container">
                          <p className="ecommerce-application-user-order-history-page-order-group-card-payment-details-provider-text-line">
                            Payment Provider:
                            {" "}
                            {completedOrderHistoryGroupObjectValue.completedOrderPaymentDetailsObjectValue.paymentProviderNameValue}
                          </p>
                          <p className="ecommerce-application-user-order-history-page-order-group-card-payment-details-transaction-id-text-line">
                            Transaction ID:
                            {" "}
                            {completedOrderHistoryGroupObjectValue.completedOrderPaymentDetailsObjectValue.stripePaymentIntentIdValue}
                          </p>
                        </div>
                      ) : null}

                    <ul className="ecommerce-application-user-order-history-page-order-group-card-items-list-container">
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
                            className="ecommerce-application-user-order-history-page-order-group-card-items-list-item-container"
                            key={`${completedOrderHistoryGroupObjectValue.completedOrderTrackingIdValue}_${completedOrderItemObjectValue.productIdValue}`}
                          >
                            <p className="ecommerce-application-user-order-history-page-order-group-card-item-name-text-line">
                              {completedOrderItemObjectValue.productNameValue}
                            </p>
                            <p className="ecommerce-application-user-order-history-page-order-group-card-item-description-text-line">
                              {completedOrderItemObjectValue.productDescriptionValue ||
                                "No item description available for this purchased product."}
                            </p>
                            <p className="ecommerce-application-user-order-history-page-order-group-card-item-quantity-text-line">
                              Quantity:
                              {" "}
                              {orderItemQuantityValue}
                            </p>
                            <p className="ecommerce-application-user-order-history-page-order-group-card-item-unit-price-text-line">
                              Unit Price:
                              {" "}
                              {formatOrderCurrencyAmountTextValue({
                                amountNumberValue: orderItemUnitPriceAmountValue,
                                currencyCodeTextValue: orderCurrencyCodeValue
                              })}
                            </p>
                            <p className="ecommerce-application-user-order-history-page-order-group-card-item-total-price-text-line">
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

function formatOrderCurrencyAmountTextValue({
  amountNumberValue,
  currencyCodeTextValue
}) {
  const normalizedAmountNumberValue = Number(amountNumberValue || 0);
  return `${currencyCodeTextValue} ${normalizedAmountNumberValue.toFixed(2)}`;
}

function buildOrderStatusBadgeClassNameTextValue(completedOrderStatusTextValue) {
  const normalizedCompletedOrderStatusTextValue = String(
    completedOrderStatusTextValue || "UNKNOWN"
  )
    .toUpperCase()
    .trim();

  if (normalizedCompletedOrderStatusTextValue === "PAID") {
    return "ecommerce-application-user-order-history-page-order-group-card-status-badge-text-line ecommerce-application-user-order-history-page-order-group-card-status-badge-paid-state-text-line";
  }

  if (normalizedCompletedOrderStatusTextValue === "COMPLETED") {
    return "ecommerce-application-user-order-history-page-order-group-card-status-badge-text-line ecommerce-application-user-order-history-page-order-group-card-status-badge-completed-state-text-line";
  }

  return "ecommerce-application-user-order-history-page-order-group-card-status-badge-text-line ecommerce-application-user-order-history-page-order-group-card-status-badge-unknown-state-text-line";
}
