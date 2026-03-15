const frontendApplicationApiBaseUrlValue =
  process.env.REACT_APP_BACKEND_BASE_URL || "http://localhost:3001";

export async function fetchProductCatalogListRequest() {
  // I call backend products endpoint and get list data for listing page.
  const productCatalogHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/products`,
    {
      method: "GET"
    }
  );

  const parsedProductCatalogResponseData =
    await parseJsonResponseBodySafely(productCatalogHttpResponse);

  if (!productCatalogHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: productCatalogHttpResponse.status,
      fallbackMessageTextValue: "Product catalog request is not successful.",
      parsedResponseBodyPayloadObject: parsedProductCatalogResponseData
    });
  }

  return parsedProductCatalogResponseData;
}

export async function fetchSingleProductDetailsByIdRequest(productIdValue) {
  // I call backend endpoint for one product details page by product id.
  const singleProductDetailsHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/products/${productIdValue}`,
    {
      method: "GET"
    }
  );

  const parsedSingleProductDetailsResponseData =
    await parseJsonResponseBodySafely(singleProductDetailsHttpResponse);

  if (!singleProductDetailsHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: singleProductDetailsHttpResponse.status,
      fallbackMessageTextValue:
        "Single product details request is not successful.",
      parsedResponseBodyPayloadObject: parsedSingleProductDetailsResponseData
    });
  }

  return parsedSingleProductDetailsResponseData;
}

async function parseJsonResponseBodySafely(httpResponseObjectValue) {
  const responseBodyRawTextValue = await httpResponseObjectValue.text();

  if (!responseBodyRawTextValue) {
    return {};
  }

  try {
    return JSON.parse(responseBodyRawTextValue);
  } catch {
    return {};
  }
}

function buildHttpRequestErrorObject({
  httpStatusCodeValue,
  fallbackMessageTextValue,
  parsedResponseBodyPayloadObject
}) {
  const httpRequestErrorObject = new Error(
    parsedResponseBodyPayloadObject.message || fallbackMessageTextValue
  );
  httpRequestErrorObject.httpStatusCodeValue = httpStatusCodeValue;
  return httpRequestErrorObject;
}
