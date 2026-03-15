import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { completePaidCurrentActiveCartIntoPastOrderRequest } from "../services/applicationCheckoutPaymentHttpService";

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
      className="ecommerce-application-checkout-flow-page-stripe-payment-form-wrapper-container"
      onSubmit={handleCheckoutStripePaymentFormSubmitAction}
    >
      <div className="ecommerce-application-checkout-flow-page-stripe-payment-form-payment-element-wrapper-container">
        <PaymentElement />
      </div>

      <button
        className="ecommerce-application-checkout-flow-page-stripe-payment-form-submit-payment-button-element"
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
