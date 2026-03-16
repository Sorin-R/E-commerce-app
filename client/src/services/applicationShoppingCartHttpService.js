import { getFrontendApplicationBackendApiBaseUrlTextValue } from "./applicationBackendBaseUrlSupportService";

const frontendApplicationApiBaseUrlValue =
  getFrontendApplicationBackendApiBaseUrlTextValue();

export async function getCurrentActiveCartItemsRequest() {
  // I load current active cart from backend session store for logged user.
  const currentActiveCartHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/cart/current-active`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  const parsedCurrentActiveCartResponseData =
    await parseJsonResponseBodySafely(currentActiveCartHttpResponse);

  if (!currentActiveCartHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: currentActiveCartHttpResponse.status,
      fallbackMessageTextValue:
        "Current active cart request is not successful.",
      parsedResponseBodyPayloadObject: parsedCurrentActiveCartResponseData
    });
  }

  return parsedCurrentActiveCartResponseData;
}

export async function getPastCompletedOrderHistoryGroupListRequest() {
  const pastCompletedOrderHistoryHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/cart/past-order-history`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  const parsedPastCompletedOrderHistoryResponseData =
    await parseJsonResponseBodySafely(pastCompletedOrderHistoryHttpResponse);

  if (!pastCompletedOrderHistoryHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: pastCompletedOrderHistoryHttpResponse.status,
      fallbackMessageTextValue:
        "Past completed order history request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedPastCompletedOrderHistoryResponseData
    });
  }

  return parsedPastCompletedOrderHistoryResponseData;
}

export async function addProductItemIntoCurrentActiveCartRequest({
  productIdValue,
  quantityValue
}) {
  const addProductItemIntoCurrentActiveCartHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/cart/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        productIdValue,
        quantityValue
      })
    }
  );

  const parsedAddProductItemIntoCurrentActiveCartResponseData =
    await parseJsonResponseBodySafely(
      addProductItemIntoCurrentActiveCartHttpResponse
    );

  if (!addProductItemIntoCurrentActiveCartHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue:
        addProductItemIntoCurrentActiveCartHttpResponse.status,
      fallbackMessageTextValue:
        "Add product item into current active cart request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedAddProductItemIntoCurrentActiveCartResponseData
    });
  }

  return parsedAddProductItemIntoCurrentActiveCartResponseData;
}

export async function deleteProductItemFromCurrentActiveCartByIdRequest(
  productIdValue
) {
  const deleteProductItemFromCurrentActiveCartHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/cart/items/${productIdValue}`,
    {
      method: "DELETE",
      credentials: "include"
    }
  );

  const parsedDeleteProductItemFromCurrentActiveCartResponseData =
    await parseJsonResponseBodySafely(
      deleteProductItemFromCurrentActiveCartHttpResponse
    );

  if (!deleteProductItemFromCurrentActiveCartHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue:
        deleteProductItemFromCurrentActiveCartHttpResponse.status,
      fallbackMessageTextValue:
        "Delete product item from current active cart request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedDeleteProductItemFromCurrentActiveCartResponseData
    });
  }

  return parsedDeleteProductItemFromCurrentActiveCartResponseData;
}

export async function completeCurrentActiveCartIntoPastCompletedOrderRequest() {
  const completeCurrentActiveCartIntoPastCompletedOrderHttpResponse =
    await fetch(
      `${frontendApplicationApiBaseUrlValue}/api/cart/current-active/complete-as-order`,
      {
        method: "POST",
        credentials: "include"
      }
    );

  const parsedCompleteCurrentActiveCartIntoPastCompletedOrderResponseData =
    await parseJsonResponseBodySafely(
      completeCurrentActiveCartIntoPastCompletedOrderHttpResponse
    );

  if (!completeCurrentActiveCartIntoPastCompletedOrderHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue:
        completeCurrentActiveCartIntoPastCompletedOrderHttpResponse.status,
      fallbackMessageTextValue:
        "Complete current active cart into past completed order request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedCompleteCurrentActiveCartIntoPastCompletedOrderResponseData
    });
  }

  return parsedCompleteCurrentActiveCartIntoPastCompletedOrderResponseData;
}

// I make this function for parseJsonResponseBodySafely logic here.
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

// I make this function for buildHttpRequestErrorObject logic here.
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
