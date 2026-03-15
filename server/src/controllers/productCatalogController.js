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

async function getProductCatalogListController(request, response) {
  try {
    // I try load products from postgres table first, this is main real source.
    const productCatalogQueryResult = await postgresDatabasePoolConnection.query(
      `
        SELECT
          id,
          name,
          description,
          image_url
        FROM products
        ORDER BY id ASC
      `
    );

    const mappedProductCatalogListForResponse =
      productCatalogQueryResult.rows.map(
        mapDatabaseProductRowToPublicProductPayload
      );

    return response.status(200).json({
      message: "Products list loaded from database.",
      source: "database",
      products: mappedProductCatalogListForResponse
    });
  } catch (error) {
    // If products table is missing now, I still return fallback list so frontend works.
    if (error.code === "42P01") {
      return response.status(200).json({
        message:
          "Products table not found, fallback development list is returned.",
        source: "fallback",
        products: fallbackProductCatalogListForDevelopmentUsage
      });
    }

    console.error("Products listing endpoint error:", error);

    return response.status(500).json({
      message: "Server error when trying load products list."
    });
  }
}

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

function mapDatabaseProductRowToPublicProductPayload(databaseProductRowObject) {
  const normalizedProductDescriptionTextValue =
    databaseProductRowObject.description || "No description available for now.";

  return {
    id: databaseProductRowObject.id,
    name: databaseProductRowObject.name,
    description: normalizedProductDescriptionTextValue,
    detailedDescriptionText:
      `${normalizedProductDescriptionTextValue} Product details loaded from database endpoint.`,
    unitPriceAmount: null,
    currencyCode: "USD",
    availabilityStatusText: "In Stock",
    imageUrl: databaseProductRowObject.image_url || null
  };
}

function findFallbackProductByIdValue(productIdValue) {
  return (
    fallbackProductCatalogListForDevelopmentUsage.find(
      (fallbackProductCatalogItemObjectValue) =>
        Number(fallbackProductCatalogItemObjectValue.id) ===
        Number(productIdValue)
    ) || null
  );
}

async function getSingleProductDetailsByIdFromDataSourceByIdValue(
  productIdValue
) {
  try {
    // I query one product from products table first because this is main data source.
    const singleProductDetailsQueryResult =
      await postgresDatabasePoolConnection.query(
        `
          SELECT
            id,
            name,
            description,
            image_url
          FROM products
          WHERE id = $1
          LIMIT 1
        `,
        [productIdValue]
      );

    if (singleProductDetailsQueryResult.rowCount > 0) {
      return {
        sourceValue: "database",
        productDetailsPayloadObjectValue: mapDatabaseProductRowToPublicProductPayload(
          singleProductDetailsQueryResult.rows[0]
        )
      };
    }
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }
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
