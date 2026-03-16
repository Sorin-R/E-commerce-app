const Stripe = require("stripe");
const {
  getSingleProductDetailsByIdFromDataSourceByIdValue
} = require("./productCatalogController");
const {
  getOrCreateShoppingCartSessionTrackingStateObjectValue,
  calculateCurrentActiveCartSummaryObjectValue,
  buildCurrentActiveCartResponsePayloadObjectValue,
  completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue
} = require("../helpers/shoppingCartSessionTrackingSupportHelper");

let stripeApiClientObjectValue = null;

async function createStripePaymentIntentForCurrentActiveCartController(
  request,
  response
) {
  try {
    const shoppingCartSessionTrackingStateObjectValue =
      getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
    const currentActiveCartItemsListValue =
      shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue;

    // I patch old cart sessions by loading current price from product source when missing.
    await enrichCurrentActiveCartItemsWithLatestPriceDataAction(
      currentActiveCartItemsListValue
    );

    if (!currentActiveCartItemsListValue.length) {
      return response.status(400).json({
        message:
          "Current active cart is empty. Add product items before payment intent create."
      });
    }

    const { currentActiveCartKnownTotalPriceAmountValue } =
      calculateCurrentActiveCartSummaryObjectValue(
        currentActiveCartItemsListValue
      );

    const stripePaymentAmountInSmallestCurrencyUnitNumberValue =
      Math.round(currentActiveCartKnownTotalPriceAmountValue * 100);

    if (stripePaymentAmountInSmallestCurrencyUnitNumberValue <= 0) {
      return response.status(400).json({
        message:
          "Current active cart known total price is invalid for payment request."
      });
    }

    const stripeCurrencyCodeValue =
      findStripeCurrencyCodeFromCurrentActiveCartItemsListValue(
        currentActiveCartItemsListValue
      );

    const stripeApiClientInstanceValue = getStripeApiClientInstanceValue();

    if (!stripeApiClientInstanceValue) {
      return response.status(500).json({
        message:
          "Stripe secret key is missing in backend environment configuration."
      });
    }

    // I create payment intent in backend so amount is trusted and not from browser input.
    const createdStripePaymentIntentPayloadObjectValue =
      await stripeApiClientInstanceValue.paymentIntents.create({
        amount: stripePaymentAmountInSmallestCurrencyUnitNumberValue,
        currency: stripeCurrencyCodeValue,
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          authenticatedSessionUserIdValue: String(
            request.authenticatedSessionUser?.id || ""
          ),
          currentActiveCartTotalQuantityValue: String(
            currentActiveCartItemsListValue.reduce(
              (runningCurrentActiveCartTotalQuantityValue, currentActiveCartItemObjectValue) =>
                runningCurrentActiveCartTotalQuantityValue +
                Number(currentActiveCartItemObjectValue.quantityValue || 0),
              0
            )
          )
        }
      });

    return response.status(200).json({
      message: "Stripe payment intent for current active cart is created.",
      stripePaymentIntentIdValue:
        createdStripePaymentIntentPayloadObjectValue.id,
      stripePaymentClientSecretValue:
        createdStripePaymentIntentPayloadObjectValue.client_secret,
      stripeCurrencyCodeValue,
      stripePaymentAmountInSmallestCurrencyUnitNumberValue,
      stripePaymentAmountDisplayTextValue: buildPaymentAmountDisplayTextValue({
        stripePaymentAmountInSmallestCurrencyUnitNumberValue,
        stripeCurrencyCodeValue
      }),
      ...buildCurrentActiveCartResponsePayloadObjectValue(
        currentActiveCartItemsListValue
      )
    });
  } catch (error) {
    console.error("Create stripe payment intent endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying create stripe payment intent."
    });
  }
}

async function completePaidCurrentActiveCartIntoPastOrderController(
  request,
  response
) {
  const stripePaymentIntentIdValue = request.body?.stripePaymentIntentIdValue;

  if (
    !stripePaymentIntentIdValue ||
    typeof stripePaymentIntentIdValue !== "string"
  ) {
    return response.status(400).json({
      message: "Stripe payment intent id value is required."
    });
  }

  try {
    const shoppingCartSessionTrackingStateObjectValue =
      getOrCreateShoppingCartSessionTrackingStateObjectValue(request);
    const currentActiveCartItemsListValue =
      shoppingCartSessionTrackingStateObjectValue.currentActiveCartItemsListValue;

    await enrichCurrentActiveCartItemsWithLatestPriceDataAction(
      currentActiveCartItemsListValue
    );

    if (!currentActiveCartItemsListValue.length) {
      return response.status(400).json({
        message:
          "Current active cart is empty now. Cannot complete paid order from empty cart."
      });
    }

    const { currentActiveCartKnownTotalPriceAmountValue } =
      calculateCurrentActiveCartSummaryObjectValue(
        currentActiveCartItemsListValue
      );

    const expectedStripePaymentAmountInSmallestCurrencyUnitNumberValue =
      Math.round(currentActiveCartKnownTotalPriceAmountValue * 100);
    const expectedStripeCurrencyCodeValue =
      findStripeCurrencyCodeFromCurrentActiveCartItemsListValue(
        currentActiveCartItemsListValue
      );

    const stripeApiClientInstanceValue = getStripeApiClientInstanceValue();

    if (!stripeApiClientInstanceValue) {
      return response.status(500).json({
        message:
          "Stripe secret key is missing in backend environment configuration."
      });
    }

    const retrievedStripePaymentIntentPayloadObjectValue =
      await stripeApiClientInstanceValue.paymentIntents.retrieve(
        stripePaymentIntentIdValue
      );
    const expectedAuthenticatedSessionUserIdValue = String(
      request.authenticatedSessionUser?.id || ""
    );
    const stripePaymentIntentMetadataAuthenticatedSessionUserIdValue = String(
      retrievedStripePaymentIntentPayloadObjectValue.metadata
        ?.authenticatedSessionUserIdValue || ""
    );

    if (
      expectedAuthenticatedSessionUserIdValue &&
      stripePaymentIntentMetadataAuthenticatedSessionUserIdValue &&
      expectedAuthenticatedSessionUserIdValue !==
        stripePaymentIntentMetadataAuthenticatedSessionUserIdValue
    ) {
      return response.status(403).json({
        message:
          "Stripe payment intent does not belong to current authenticated user session."
      });
    }

    if (
      retrievedStripePaymentIntentPayloadObjectValue.status !== "succeeded"
    ) {
      return response.status(400).json({
        message:
          "Stripe payment intent is not succeeded yet. Complete payment first."
      });
    }

    if (
      Number(retrievedStripePaymentIntentPayloadObjectValue.amount) !==
      Number(expectedStripePaymentAmountInSmallestCurrencyUnitNumberValue)
    ) {
      return response.status(400).json({
        message:
          "Stripe payment amount does not match current cart amount. Please refresh checkout and try again."
      });
    }

    if (
      String(retrievedStripePaymentIntentPayloadObjectValue.currency || "")
        .toLowerCase()
        .trim() !== expectedStripeCurrencyCodeValue
    ) {
      return response.status(400).json({
        message:
          "Stripe payment currency does not match current cart currency. Please refresh checkout and try again."
      });
    }

    const completedOrderHistoryGroupPayloadObjectValue =
      completeCurrentActiveCartIntoPastCompletedOrderFromSessionStateValue(
        shoppingCartSessionTrackingStateObjectValue,
        {
          completedOrderStatusTextValue: "PAID",
          completedOrderPaymentDetailsObjectValue: {
            paymentProviderNameValue: "Stripe",
            stripePaymentIntentIdValue:
              retrievedStripePaymentIntentPayloadObjectValue.id,
            stripePaymentIntentStatusTextValue:
              retrievedStripePaymentIntentPayloadObjectValue.status,
            stripeCurrencyCodeValue: expectedStripeCurrencyCodeValue,
            stripePaymentAmountInSmallestCurrencyUnitNumberValue:
              expectedStripePaymentAmountInSmallestCurrencyUnitNumberValue
          }
        }
      );

    if (!completedOrderHistoryGroupPayloadObjectValue) {
      return response.status(400).json({
        message:
          "Current active cart is empty now. Cannot create completed paid order."
      });
    }

    return response.status(200).json({
      message:
        "Stripe payment is verified and current active cart is moved to past orders.",
      completedOrderHistoryGroupPayloadObjectValue,
      ...buildCurrentActiveCartResponsePayloadObjectValue([]),
      pastCompletedOrderHistoryGroupListValue:
        shoppingCartSessionTrackingStateObjectValue.pastCompletedOrderHistoryGroupListValue
    });
  } catch (error) {
    console.error("Complete paid order endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying complete paid checkout order."
    });
  }
}

function getStripeApiClientInstanceValue() {
  const stripeSecretKeyValue = process.env.STRIPE_SECRET_KEY || "";

  if (!stripeSecretKeyValue) {
    return null;
  }

  if (!stripeApiClientObjectValue) {
    stripeApiClientObjectValue = new Stripe(stripeSecretKeyValue);
  }

  return stripeApiClientObjectValue;
}

function findStripeCurrencyCodeFromCurrentActiveCartItemsListValue(
  currentActiveCartItemsListValue
) {
  const firstCurrentActiveCartItemWithCurrencyCodeObjectValue =
    currentActiveCartItemsListValue.find(
      (currentActiveCartItemObjectValue) =>
        currentActiveCartItemObjectValue.productCurrencyCodeValue
    );

  const normalizedStripeCurrencyCodeValue = String(
    firstCurrentActiveCartItemWithCurrencyCodeObjectValue?.productCurrencyCodeValue ||
      "USD"
  )
    .toLowerCase()
    .trim();

  return normalizedStripeCurrencyCodeValue || "usd";
}

function buildPaymentAmountDisplayTextValue({
  stripePaymentAmountInSmallestCurrencyUnitNumberValue,
  stripeCurrencyCodeValue
}) {
  return `${stripeCurrencyCodeValue.toUpperCase()} ${(
    stripePaymentAmountInSmallestCurrencyUnitNumberValue / 100
  ).toFixed(2)}`;
}

async function enrichCurrentActiveCartItemsWithLatestPriceDataAction(
  currentActiveCartItemsListValue
) {
  if (!Array.isArray(currentActiveCartItemsListValue)) {
    return;
  }

  for (const currentActiveCartItemObjectValue of currentActiveCartItemsListValue) {
    const normalizedCurrentActiveCartItemKnownUnitPriceAmountValue = Number(
      currentActiveCartItemObjectValue.productUnitPriceAmountValue
    );

    if (
      Number.isFinite(normalizedCurrentActiveCartItemKnownUnitPriceAmountValue) &&
      normalizedCurrentActiveCartItemKnownUnitPriceAmountValue > 0
    ) {
      continue;
    }

    const normalizedCurrentActiveCartItemProductIdValue = Number(
      currentActiveCartItemObjectValue.productIdValue
    );

    if (
      !Number.isInteger(normalizedCurrentActiveCartItemProductIdValue) ||
      normalizedCurrentActiveCartItemProductIdValue <= 0
    ) {
      continue;
    }

    try {
      const singleProductDetailsLookupResultObjectValue =
        await getSingleProductDetailsByIdFromDataSourceByIdValue(
          normalizedCurrentActiveCartItemProductIdValue
        );
      const productDetailsPayloadObjectValue =
        singleProductDetailsLookupResultObjectValue?.productDetailsPayloadObjectValue;
      const normalizedProductUnitPriceAmountFromProductSourceValue = Number(
        productDetailsPayloadObjectValue?.unitPriceAmount
      );

      if (
        Number.isFinite(normalizedProductUnitPriceAmountFromProductSourceValue) &&
        normalizedProductUnitPriceAmountFromProductSourceValue > 0
      ) {
        currentActiveCartItemObjectValue.productUnitPriceAmountValue =
          normalizedProductUnitPriceAmountFromProductSourceValue;
        currentActiveCartItemObjectValue.productCurrencyCodeValue =
          productDetailsPayloadObjectValue?.currencyCode || "USD";
      }
    } catch (error) {
      console.error("Cart price enrichment item error:", error);
    }
  }
}

module.exports = {
  createStripePaymentIntentForCurrentActiveCartController,
  completePaidCurrentActiveCartIntoPastOrderController
};
