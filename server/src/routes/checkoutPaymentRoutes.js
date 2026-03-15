const express = require("express");
const {
  requireAuthenticatedSessionUserMiddleware
} = require("../middlewares/requireAuthenticatedSessionUserMiddleware");
const {
  createStripePaymentIntentForCurrentActiveCartController,
  completePaidCurrentActiveCartIntoPastOrderController
} = require("../controllers/checkoutPaymentController");

const checkoutPaymentRouter = express.Router();

// I protect checkout payment endpoints because only logged user can buy products.
checkoutPaymentRouter.use(requireAuthenticatedSessionUserMiddleware);

checkoutPaymentRouter.post(
  "/create-payment-intent",
  createStripePaymentIntentForCurrentActiveCartController
);
checkoutPaymentRouter.post(
  "/complete-paid-order",
  completePaidCurrentActiveCartIntoPastOrderController
);

module.exports = {
  checkoutPaymentRouter
};
