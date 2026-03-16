import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { completePaidCurrentActiveCartIntoPastOrderRequest } from "../services/applicationCheckoutPaymentHttpService";

// I make this function for ApplicationCheckoutStripePaymentForm logic here.
function ApplicationCheckoutStripePaymentForm({
  onPaidCheckoutOrderCompletedSuccessfullyAction,
  onCheckoutStripePaymentFlowFeedbackMessageChangeAction
}) {
  const stripeObjectValue = useStripe();
  const stripeElementsObjectValue = useElements();
  const [
    isCheckoutStripePaymentSubmitActionLoadingState,
    setIsCheckoutStripePaymentSubmitActionLoadingState
  ] = useState(false);

  const handleCheckoutStripePaymentFormSubmitAction = async (
    checkoutStripePaymentFormSubmitEvent
  ) => {
    checkoutStripePaymentFormSubmitEvent.preventDefault();

    if (!stripeObjectValue || !stripeElementsObjectValue) {
      return;
    }

    try {
      setIsCheckoutStripePaymentSubmitActionLoadingState(true);
      onCheckoutStripePaymentFlowFeedbackMessageChangeAction("");

      // I confirm payment with stripe elements first, then I ask backend to move cart into paid order.
      const confirmStripePaymentResultObjectValue =
        await stripeObjectValue.confirmPayment({
          elements: stripeElementsObjectValue,
          redirect: "if_required"
        });

      if (confirmStripePaymentResultObjectValue.error) {
        onCheckoutStripePaymentFlowFeedbackMessageChangeAction(
          confirmStripePaymentResultObjectValue.error.message ||
            "Stripe payment confirm failed. Please retry."
        );
        return;
      }

      const successfulStripePaymentIntentPayloadObjectValue =
        confirmStripePaymentResultObjectValue.paymentIntent;

      if (
        !successfulStripePaymentIntentPayloadObjectValue ||
        successfulStripePaymentIntentPayloadObjectValue.status !== "succeeded"
      ) {
        onCheckoutStripePaymentFlowFeedbackMessageChangeAction(
          "Stripe payment is not completed now. Please finish payment step."
        );
        return;
      }

      const completePaidCurrentActiveCartIntoPastOrderResponsePayloadObjectValue =
        await completePaidCurrentActiveCartIntoPastOrderRequest({
          stripePaymentIntentIdValue:
            successfulStripePaymentIntentPayloadObjectValue.id
        });

      if (onPaidCheckoutOrderCompletedSuccessfullyAction) {
        onPaidCheckoutOrderCompletedSuccessfullyAction(
          completePaidCurrentActiveCartIntoPastOrderResponsePayloadObjectValue
        );
      }
    } catch (error) {
      onCheckoutStripePaymentFlowFeedbackMessageChangeAction(
        error.message || "Cannot complete paid checkout order now."
      );
    } finally {
      setIsCheckoutStripePaymentSubmitActionLoadingState(false);
    }
  };

  return (
    <form
      className="ecom-app-check-page-stripe-payment-form-wrap-box"
      onSubmit={handleCheckoutStripePaymentFormSubmitAction}
    >
      <div className="ecom-app-check-page-stripe-form-pay-wrap-box">
        <PaymentElement />
      </div>

      <button
        className="ecom-app-check-page-stripe-form-submit-btn-el"
        type="submit"
        disabled={
          !stripeObjectValue ||
          !stripeElementsObjectValue ||
          isCheckoutStripePaymentSubmitActionLoadingState
        }
      >
        {isCheckoutStripePaymentSubmitActionLoadingState
          ? "Processing Payment..."
          : "Pay and Complete Order"}
      </button>
    </form>
  );
}

export default ApplicationCheckoutStripePaymentForm;
