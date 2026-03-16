import { getFrontendApplicationBackendApiBaseUrlTextValue } from "./applicationBackendBaseUrlSupportService";

const frontendApplicationApiBaseUrlValue =
  getFrontendApplicationBackendApiBaseUrlTextValue();

export async function createStripePaymentIntentForCurrentActiveCartRequest() {
  // I call backend endpoint to create stripe payment intent from trusted cart total.
  const createStripePaymentIntentHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/checkout/create-payment-intent`,
    {
      method: "POST",
      credentials: "include"
    }
  );

  const parsedCreateStripePaymentIntentResponseDataObjectValue =
    await parseJsonResponseBodySafely(createStripePaymentIntentHttpResponse);

  if (!createStripePaymentIntentHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue: createStripePaymentIntentHttpResponse.status,
      fallbackMessageTextValue:
        "Create stripe payment intent request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedCreateStripePaymentIntentResponseDataObjectValue
    });
  }

  return parsedCreateStripePaymentIntentResponseDataObjectValue;
}

export async function completePaidCurrentActiveCartIntoPastOrderRequest({
  stripePaymentIntentIdValue
}) {
  const completePaidCurrentActiveCartIntoPastOrderHttpResponse = await fetch(
    `${frontendApplicationApiBaseUrlValue}/api/checkout/complete-paid-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        stripePaymentIntentIdValue
      })
    }
  );

  const parsedCompletePaidCurrentActiveCartIntoPastOrderResponseDataObjectValue =
    await parseJsonResponseBodySafely(
      completePaidCurrentActiveCartIntoPastOrderHttpResponse
    );

  if (!completePaidCurrentActiveCartIntoPastOrderHttpResponse.ok) {
    throw buildHttpRequestErrorObject({
      httpStatusCodeValue:
        completePaidCurrentActiveCartIntoPastOrderHttpResponse.status,
      fallbackMessageTextValue:
        "Complete paid current active cart into past order request is not successful.",
      parsedResponseBodyPayloadObject:
        parsedCompletePaidCurrentActiveCartIntoPastOrderResponseDataObjectValue
    });
  }

  return parsedCompletePaidCurrentActiveCartIntoPastOrderResponseDataObjectValue;
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
