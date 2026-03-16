// I make this function for getOrCreateShoppingCartSessionTrackingStateObjectValue logic here.
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

// I make this function for calculateCurrentActiveCartSummaryObjectValue logic here.
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
        const normalizedCurrentActiveCartItemUnitPriceAmountValue = Number(
          currentActiveCartItemObjectValue.productUnitPriceAmountValue
        );
        const normalizedCurrentActiveCartItemQuantityValue = Number(
          currentActiveCartItemObjectValue.quantityValue || 0
        );

        if (
          Number.isFinite(normalizedCurrentActiveCartItemUnitPriceAmountValue) &&
          normalizedCurrentActiveCartItemUnitPriceAmountValue > 0 &&
          Number.isFinite(normalizedCurrentActiveCartItemQuantityValue) &&
          normalizedCurrentActiveCartItemQuantityValue > 0
        ) {
          return (
            runningKnownTotalPriceAmountValue +
            normalizedCurrentActiveCartItemUnitPriceAmountValue *
              normalizedCurrentActiveCartItemQuantityValue
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

// I make this function for buildCurrentActiveCartResponsePayloadObjectValue logic here.
function buildCurrentActiveCartResponsePayloadObjectValue(
  currentActiveCartItemsListValue
) {
  return {
    currentActiveCartItemsListValue,
    ...calculateCurrentActiveCartSummaryObjectValue(currentActiveCartItemsListValue)
  };
}

// I make this function for completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue logic here.
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

// I make this function for buildCompletedOrderTrackingIdValue logic here.
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
