function getOrCreateShoppingCartSessionTrackingStateObjectValue(request) {
  if (!request.session) {
    return {
      currentActiveCartItemsListValue: [],
      pastCompletedOrderHistoryGroupListValue: []
    };
  }

  if (!request.session.shoppingCartSessionTrackingStateObjectValue) {
    request.session.shoppingCartSessionTrackingStateObjectValue = {
      currentActiveCartItemsListValue: [],
      pastCompletedOrderHistoryGroupListValue: []
    };
  }

  return request.session.shoppingCartSessionTrackingStateObjectValue;
}

function calculateCurrentActiveCartSummaryObjectValue(currentActiveCartItemsListValue) {
  const currentActiveCartTotalQuantityValue = currentActiveCartItemsListValue.reduce(
    (runningTotalQuantityValue, currentActiveCartItemObjectValue) =>
      runningTotalQuantityValue +
      Number(currentActiveCartItemObjectValue.quantityValue || 0),
    0
  );

  const currentActiveCartKnownTotalPriceAmountValue =
    currentActiveCartItemsListValue.reduce(
      (runningKnownTotalPriceAmountValue, currentActiveCartItemObjectValue) => {
        if (
          typeof currentActiveCartItemObjectValue.productUnitPriceAmountValue ===
          "number"
        ) {
          return (
            runningKnownTotalPriceAmountValue +
            currentActiveCartItemObjectValue.productUnitPriceAmountValue *
              Number(currentActiveCartItemObjectValue.quantityValue || 0)
          );
        }

        return runningKnownTotalPriceAmountValue;
      },
      0
    );

  return {
    currentActiveCartTotalQuantityValue,
    currentActiveCartKnownTotalPriceAmountValue
  };
}

function buildCurrentActiveCartResponsePayloadObjectValue(
  currentActiveCartItemsListValue
) {
  return {
    currentActiveCartItemsListValue,
    ...calculateCurrentActiveCartSummaryObjectValue(currentActiveCartItemsListValue)
  };
}

function completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue(
  shoppingCartSessionTrackingStateObjectValue,
  {
    completedOrderStatusTextValue = "COMPLETED",
    completedOrderPaymentDetailsObjectValue = null
  } = {}
) {
  const currentActiveCartItemsListValue =
    shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue ||
    [];

  if (!currentActiveCartItemsListValue.length) {
    return null;
  }

  const completedOrderHistoryGroupPayloadObjectValue = {
    completedOrderTrackingIdValue: buildCompletedOrderTrackingIdValue(),
    completedOrderCreatedAtIsoDateTextValue: new Date().toISOString(),
    completedOrderStatusTextValue,
    completedOrderItemsListValue: [...currentActiveCartItemsListValue]
  };

  if (completedOrderPaymentDetailsObjectValue) {
    completedOrderHistoryGroupPayloadObjectValue.completedOrderPaymentDetailsObjectValue =
      completedOrderPaymentDetailsObjectValue;
  }

  shoppingCartSessionTrackingStateObjectValue.pastCompletedOrderHistoryGroupListValue.push(
    completedOrderHistoryGroupPayloadObjectValue
  );
  shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue = [];

  return completedOrderHistoryGroupPayloadObjectValue;
}

function buildCompletedOrderTrackingIdValue() {
  const timestampNumberValue = Date.now();
  const randomNumberSuffixValue = Math.floor(Math.random() * 100000);
  return `completed_order_${timestampNumberValue}_${randomNumberSuffixValue}`;
}

module.exports = {
  getOrCreateShoppingCartSessionTrackingStateObjectValue,
  calculateCurrentActiveCartSummaryObjectValue,
  buildCurrentActiveCartResponsePayloadObjectValue,
  completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue
};
