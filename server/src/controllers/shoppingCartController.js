const {
  getSingleProductDetailsByIdFromDataSourceByIdValue
} = require("./productCatalogController");
const {
  getOrCreateShoppingCartSessionTrackingStateObjectValue,
  buildCurrentActiveCartResponsePayloadObjectValue,
  completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue
} = require("../helpers/shoppingCartSessionTrackingSupportHelper");

// I make this function for getCurrentActiveCartItemsController logic here.
async function getCurrentActiveCartItemsController(request, response) {
  const shoppingCartSessionTrackingStateObjectValue =
    getOrCreateShoppingCartSessionTrackingStateObjectValue(request);

  return response.status(200).json({
    message: "Current active cart items are loaded.",
    ...buildCurrentActiveCartResponsePayloadObjectValue(
      shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue
    )
  });
}

// I make this function for getPastCompletedOrderHistoryGroupListController logic here.
async function getPastCompletedOrderHistoryGroupListController(
  request,
  response
) {
  const shoppingCartSessionTrackingStateObjectValue =
    getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
  const sortedPastCompletedOrderHistoryGroupListForResponseValue =
    buildSortedPastCompletedOrderHistoryGroupListForResponseValue(
      shoppingCartSessionTrackingStateObjectValue.pastCompletedOrderHistoryGroupListValue
    );

  return response.status(200).json({
    message: "Past completed order history groups are loaded.",
    pastCompletedOrderHistoryGroupListValue:
      sortedPastCompletedOrderHistoryGroupListForResponseValue
  });
}

// I make this function for addProductItemIntoCurrentActiveCartController logic here.
async function addProductItemIntoCurrentActiveCartController(request, response) {
  const productIdValue = Number(request.body.productIdValue);
  const quantityValue = Number(request.body.quantityValue || 1);

  if (!Number.isInteger(productIdValue) || productIdValue <= 0) {
    return response.status(400).json({
      message: "Product id value is invalid."
    });
  }

  if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
    return response.status(400).json({
      message: "Quantity value is invalid."
    });
  }

  try {
    // I load product details first so cart item always have real product information.
    const singleProductDetailsLookupResultObjectValue =
      await getSingleProductDetailsByIdFromDataSourceByIdValue(productIdValue);

    if (!singleProductDetailsLookupResultObjectValue) {
      return response.status(404).json({
        message: "Cannot add product because product id was not found."
      });
    }

    const productDetailsPayloadObjectValue =
      singleProductDetailsLookupResultObjectValue.productDetailsPayloadObjectValue;

    const shoppingCartSessionTrackingStateObjectValue =
      getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
    const currentActiveCartItemsListValue =
      shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue;

    const foundCurrentActiveCartItemIndexValue =
      currentActiveCartItemsListValue.findIndex(
        (currentActiveCartItemObjectValue) =>
          Number(currentActiveCartItemObjectValue.productIdValue) ===
          Number(productIdValue)
      );

    if (foundCurrentActiveCartItemIndexValue >= 0) {
      currentActiveCartItemsListValue[
        foundCurrentActiveCartItemIndexValue
      ].quantityValue += quantityValue;
      currentActiveCartItemsListValue[
        foundCurrentActiveCartItemIndexValue
      ].productUnitPriceAmountValue = resolveCurrentActiveCartItemUnitPriceAmountValue(
        currentActiveCartItemsListValue[foundCurrentActiveCartItemIndexValue]
          .productUnitPriceAmountValue,
        productDetailsPayloadObjectValue.unitPriceAmount
      );
      currentActiveCartItemsListValue[
        foundCurrentActiveCartItemIndexValue
      ].productCurrencyCodeValue =
        productDetailsPayloadObjectValue.currencyCode || "USD";
    } else {
      currentActiveCartItemsListValue.push({
        productIdValue: productDetailsPayloadObjectValue.id,
        productNameValue: productDetailsPayloadObjectValue.name,
        productDescriptionValue: productDetailsPayloadObjectValue.description,
        productImageUrlValue: productDetailsPayloadObjectValue.imageUrl,
        productUnitPriceAmountValue: resolveCurrentActiveCartItemUnitPriceAmountValue(
          productDetailsPayloadObjectValue.unitPriceAmount,
          null
        ),
        productCurrencyCodeValue:
          productDetailsPayloadObjectValue.currencyCode || "USD",
        productAvailabilityStatusTextValue:
          productDetailsPayloadObjectValue.availabilityStatusText || "In Stock",
        quantityValue
      });
    }

    return response.status(200).json({
      message: "Product item is added into current active cart.",
      ...buildCurrentActiveCartResponsePayloadObjectValue(
        currentActiveCartItemsListValue
      )
    });
  } catch (error) {
    console.error("Add product item into cart endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying add product item into cart."
    });
  }
}

// I make this function for deleteProductItemFromCurrentActiveCartController logic here.
async function deleteProductItemFromCurrentActiveCartController(request, response) {
  const productIdValue = Number(request.params.productIdValue);

  if (!Number.isInteger(productIdValue) || productIdValue <= 0) {
    return response.status(400).json({
      message: "Product id value is invalid."
    });
  }

  const shoppingCartSessionTrackingStateObjectValue =
    getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
  const currentActiveCartItemsListValue =
    shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue;

  const remainingCurrentActiveCartItemsListValue =
    currentActiveCartItemsListValue.filter(
      (currentActiveCartItemObjectValue) =>
        Number(currentActiveCartItemObjectValue.productIdValue) !==
        Number(productIdValue)
    );

  shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue =
    remainingCurrentActiveCartItemsListValue;

  return response.status(200).json({
    message: "Product item is removed from current active cart.",
    ...buildCurrentActiveCartResponsePayloadObjectValue(
      remainingCurrentActiveCartItemsListValue
    )
  });
}

// I make this function for completeCurrentActiveCartIntoPastCompletedOrderController logic here.
async function completeCurrentActiveCartIntoPastCompletedOrderController(
  request,
  response
) {
  const shoppingCartSessionTrackingStateObjectValue =
    getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
  const completedOrderHistoryGroupPayloadObjectValue =
    completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue(
      shoppingCartSessionTrackingStateObjectValue
    );

  if (!completedOrderHistoryGroupPayloadObjectValue) {
    return response.status(400).json({
      message: "Current active cart is empty, cannot complete into past order."
    });
  }

  return response.status(200).json({
    message:
      "Current active cart is moved into past completed order history group.",
    completedOrderHistoryGroupPayloadObjectValue,
    ...buildCurrentActiveCartResponsePayloadObjectValue([]),
    pastCompletedOrderHistoryGroupListValue:
      shoppingCartSessionTrackingStateObjectValue.pastCompletedOrderHistoryGroupListValue
  });
}

module.exports = {
  getCurrentActiveCartItemsController,
  getPastCompletedOrderHistoryGroupListController,
  addProductItemIntoCurrentActiveCartController,
  deleteProductItemFromCurrentActiveCartController,
  completeCurrentActiveCartIntoPastCompletedOrderController
};

// I make this function for buildSortedPastCompletedOrderHistoryGroupListForResponseValue logic here.
function buildSortedPastCompletedOrderHistoryGroupListForResponseValue(
  pastCompletedOrderHistoryGroupListValue
) {
  const normalizedPastCompletedOrderHistoryGroupListValue = Array.isArray(
    pastCompletedOrderHistoryGroupListValue
  )
    ? pastCompletedOrderHistoryGroupListValue
    : [];

  return normalizedPastCompletedOrderHistoryGroupListValue
    .map((completedOrderHistoryGroupObjectValue) => {
      const completedOrderItemsListValue =
        completedOrderHistoryGroupObjectValue.completedOrderItemsListValue || [];
      const completedOrderTotalQuantityValue = completedOrderItemsListValue.reduce(
        (runningCompletedOrderTotalQuantityValue, completedOrderItemObjectValue) =>
          runningCompletedOrderTotalQuantityValue +
          Number(completedOrderItemObjectValue.quantityValue || 0),
        0
      );
      const completedOrderKnownTotalPriceAmountValue =
        completedOrderItemsListValue.reduce(
          (
            runningCompletedOrderKnownTotalPriceAmountValue,
            completedOrderItemObjectValue
          ) => {
            const normalizedCompletedOrderItemUnitPriceAmountValue = Number(
              completedOrderItemObjectValue.productUnitPriceAmountValue
            );
            const normalizedCompletedOrderItemQuantityValue = Number(
              completedOrderItemObjectValue.quantityValue || 0
            );

            if (
              !Number.isFinite(normalizedCompletedOrderItemUnitPriceAmountValue) ||
              normalizedCompletedOrderItemUnitPriceAmountValue <= 0 ||
              !Number.isFinite(normalizedCompletedOrderItemQuantityValue) ||
              normalizedCompletedOrderItemQuantityValue <= 0
            ) {
              return runningCompletedOrderKnownTotalPriceAmountValue;
            }

            return (
              runningCompletedOrderKnownTotalPriceAmountValue +
              normalizedCompletedOrderItemUnitPriceAmountValue *
                normalizedCompletedOrderItemQuantityValue
            );
          },
          0
        );

      return {
        ...completedOrderHistoryGroupObjectValue,
        completedOrderTotalQuantityValue,
        completedOrderKnownTotalPriceAmountValue
      };
    })
    .sort(
      (
        firstCompletedOrderHistoryGroupObjectValue,
        secondCompletedOrderHistoryGroupObjectValue
      ) =>
        new Date(
          secondCompletedOrderHistoryGroupObjectValue.completedOrderCreatedAtIsoDateTextValue
        ).getTime() -
        new Date(
          firstCompletedOrderHistoryGroupObjectValue.completedOrderCreatedAtIsoDateTextValue
        ).getTime()
    );
}

// I make this function for resolveCurrentActiveCartItemUnitPriceAmountValue logic here.
function resolveCurrentActiveCartItemUnitPriceAmountValue(
  primaryUnitPriceAmountValue,
  secondaryUnitPriceAmountValue
) {
  const normalizedPrimaryUnitPriceAmountValue = Number(primaryUnitPriceAmountValue);
  const normalizedSecondaryUnitPriceAmountValue = Number(
    secondaryUnitPriceAmountValue
  );

  if (
    Number.isFinite(normalizedPrimaryUnitPriceAmountValue) &&
    normalizedPrimaryUnitPriceAmountValue > 0
  ) {
    return normalizedPrimaryUnitPriceAmountValue;
  }

  if (
    Number.isFinite(normalizedSecondaryUnitPriceAmountValue) &&
    normalizedSecondaryUnitPriceAmountValue > 0
  ) {
    return normalizedSecondaryUnitPriceAmountValue;
  }

  return null;
}
