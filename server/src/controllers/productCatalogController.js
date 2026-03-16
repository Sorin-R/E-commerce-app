const {
  postgresDatabasePoolConnection
} = require("../database/postgresDatabasePoolConnection");

const fallbackProductCatalogListForDevelopmentUsage = [
  {
    id: 1,
    name: "Wireless Headphones",
    description:
      "Good quality wireless sound headset for work and daily music use.",
    detailedDescriptionText:
      "Comfort ear pads and long battery support make this headphones good for music, meetings, and travel day.",
    unitPriceAmount: 129.99,
    currencyCode: "USD",
    availabilityStatusText: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    description:
      "Track heart rate, daily steps, and sleep habit with one smart watch.",
    detailedDescriptionText:
      "This watch include health monitor, workout modes, and battery that can stay many days in normal usage.",
    unitPriceAmount: 179.5,
    currencyCode: "USD",
    availabilityStatusText: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    name: "Portable Bluetooth Speaker",
    description:
      "Compact speaker with strong sound for travel, room, and outdoor.",
    detailedDescriptionText:
      "Speaker body is compact and durable, with stable bluetooth connection and clear bass sound output.",
    unitPriceAmount: 74.0,
    currencyCode: "USD",
    availabilityStatusText: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    name: "Mechanical Keyboard",
    description:
      "Fast response keyboard with comfortable key press for typing and gaming.",
    detailedDescriptionText:
      "Mechanical switches give tactile feel and fast response. Good option for coding, writing, and gaming setup.",
    unitPriceAmount: 98.0,
    currencyCode: "USD",
    availabilityStatusText: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80"
  }
];

// I make this function for getProductCatalogListController logic here.
async function getProductCatalogListController(request, response) {
  try {
    // I load all columns so this endpoint still work even when db schema names are different.
    const productCatalogRowsFromDatabaseDataSourceListValue =
      await loadProductCatalogRowsFromDatabaseDataSourceListValue();

    const mappedProductCatalogListForResponse =
      productCatalogRowsFromDatabaseDataSourceListValue.map(
        mapDatabaseProductRowToPublicProductPayload
      );

    return response.status(200).json({
      message: "Products list loaded from database.",
      source: "database",
      products: mappedProductCatalogListForResponse
    });
  } catch (error) {
    console.error("Products listing endpoint error:", error);

    // I return fallback products so frontend listing still work when db query has issue.
    return response.status(200).json({
      message:
        "Products list loaded from fallback list because database query failed.",
      source: "fallback",
      products: fallbackProductCatalogListForDevelopmentUsage
    });
  }
}

// I make this function for getSingleProductDetailsByIdController logic here.
async function getSingleProductDetailsByIdController(request, response) {
  const productIdValue = Number(request.params.productId);

  if (!Number.isInteger(productIdValue) || productIdValue <= 0) {
    return response.status(400).json({
      message: "Product id value is invalid."
    });
  }

  try {
    const singleProductDetailsLookupResultObjectValue =
      await getSingleProductDetailsByIdFromDataSourceByIdValue(productIdValue);

    if (singleProductDetailsLookupResultObjectValue) {
      return response.status(200).json({
        message: "Single product details loaded.",
        source: singleProductDetailsLookupResultObjectValue.sourceValue,
        product:
          singleProductDetailsLookupResultObjectValue.productDetailsPayloadObjectValue
      });
    }

    return response.status(404).json({
      message: "Product details not found for this product id."
    });
  } catch (error) {
    console.error("Single product details endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying load product details."
    });
  }
}

// I make this function for mapDatabaseProductRowToPublicProductPayload logic here.
function mapDatabaseProductRowToPublicProductPayload(databaseProductRowObject) {
  const resolvedProductIdValue =
    resolveProductIdFromDatabaseRowObjectValue(databaseProductRowObject);
  const normalizedProductNameTextValue =
    databaseProductRowObject.name ||
    databaseProductRowObject.product_name ||
    databaseProductRowObject.title ||
    `Product ${resolvedProductIdValue || "Item"}`;
  const normalizedProductDescriptionTextValue =
    databaseProductRowObject.description ||
    databaseProductRowObject.product_description ||
    databaseProductRowObject.short_description ||
    "No description available for now.";
  const normalizedKnownProductUnitPriceAmountValue =
    parseKnownNumberValueSafely(
      databaseProductRowObject.unit_price_amount ??
        databaseProductRowObject.unit_price ??
        databaseProductRowObject.price ??
        databaseProductRowObject.product_price_amount ??
        null
    );
  const fallbackProductByIdPayloadObjectValue = findFallbackProductByIdValue(
    resolvedProductIdValue
  );
  const resolvedProductUnitPriceAmountValue =
    normalizedKnownProductUnitPriceAmountValue ||
    parseKnownNumberValueSafely(
      fallbackProductByIdPayloadObjectValue?.unitPriceAmount
    ) ||
    null;

  return {
    id: resolvedProductIdValue,
    name: normalizedProductNameTextValue,
    description: normalizedProductDescriptionTextValue,
    detailedDescriptionText:
      databaseProductRowObject.detailed_description_text ||
      databaseProductRowObject.detailed_description ||
      `${normalizedProductDescriptionTextValue} Product details loaded from database endpoint.`,
    unitPriceAmount: resolvedProductUnitPriceAmountValue,
    currencyCode:
      databaseProductRowObject.currency_code ||
      databaseProductRowObject.currency ||
      fallbackProductByIdPayloadObjectValue?.currencyCode ||
      "USD",
    availabilityStatusText:
      databaseProductRowObject.availability_status_text ||
      databaseProductRowObject.availability_status ||
      databaseProductRowObject.stock_status ||
      "In Stock",
    imageUrl:
      databaseProductRowObject.image_url ||
      databaseProductRowObject.image ||
      databaseProductRowObject.image_link ||
      databaseProductRowObject.image_src ||
      null
  };
}

// I make this function for findFallbackProductByIdValue logic here.
function findFallbackProductByIdValue(productIdValue) {
  return (
    fallbackProductCatalogListForDevelopmentUsage.find(
      (fallbackProductCatalogItemObjectValue) =>
        Number(fallbackProductCatalogItemObjectValue.id) ===
        Number(productIdValue)
    ) || null
  );
}

// I make this function for getSingleProductDetailsByIdFromDataSourceByIdValue logic here.
async function getSingleProductDetailsByIdFromDataSourceByIdValue(
  productIdValue
) {
  try {
    const productCatalogRowsFromDatabaseDataSourceListValue =
      await loadProductCatalogRowsFromDatabaseDataSourceListValue();
    const foundProductRowFromDatabaseDataSourceObjectValue =
      productCatalogRowsFromDatabaseDataSourceListValue.find(
        (databaseProductRowObjectValue) =>
          Number(
            resolveProductIdFromDatabaseRowObjectValue(
              databaseProductRowObjectValue
            )
          ) === Number(productIdValue)
      );

    if (foundProductRowFromDatabaseDataSourceObjectValue) {
      return {
        sourceValue: "database",
        productDetailsPayloadObjectValue: mapDatabaseProductRowToPublicProductPayload(
          foundProductRowFromDatabaseDataSourceObjectValue
        )
      };
    }
  } catch (error) {
    console.error("Single product lookup from database failed:", error);
  }

  const fallbackProductFromDevelopmentListValue =
    findFallbackProductByIdValue(productIdValue);

  if (!fallbackProductFromDevelopmentListValue) {
    return null;
  }

  return {
    sourceValue: "fallback",
    productDetailsPayloadObjectValue: fallbackProductFromDevelopmentListValue
  };
}

module.exports = {
  getProductCatalogListController,
  getSingleProductDetailsByIdController,
  getSingleProductDetailsByIdFromDataSourceByIdValue
};

// I make this function for loadProductCatalogRowsFromDatabaseDataSourceListValue logic here.
async function loadProductCatalogRowsFromDatabaseDataSourceListValue() {
  const productCatalogQueryResult = await postgresDatabasePoolConnection.query(
    `
      SELECT *
      FROM products
    `
  );

  return productCatalogQueryResult.rows || [];
}

// I make this function for resolveProductIdFromDatabaseRowObjectValue logic here.
function resolveProductIdFromDatabaseRowObjectValue(databaseProductRowObject) {
  const candidateProductIdValue =
    databaseProductRowObject.id ??
    databaseProductRowObject.product_id ??
    databaseProductRowObject.productid ??
    null;

  const normalizedProductIdNumberValue = Number(candidateProductIdValue);

  if (
    Number.isInteger(normalizedProductIdNumberValue) &&
    normalizedProductIdNumberValue > 0
  ) {
    return normalizedProductIdNumberValue;
  }

  return null;
}

// I make this function for parseKnownNumberValueSafely logic here.
function parseKnownNumberValueSafely(valueToParseAsNumber) {
  if (
    valueToParseAsNumber === null ||
    valueToParseAsNumber === undefined ||
    valueToParseAsNumber === ""
  ) {
    return null;
  }

  const normalizedParsedNumberValue = Number(valueToParseAsNumber);

  if (
    Number.isFinite(normalizedParsedNumberValue) &&
    normalizedParsedNumberValue > 0
  ) {
    return normalizedParsedNumberValue;
  }

  return null;
}
