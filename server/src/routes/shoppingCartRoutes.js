const express = require("express");
const {
  requireAuthenticatedSessionUserMiddleware
} = require("../middlewares/requireAuthenticatedSessionUserMiddleware");
const {
  getCurrentActiveCartItemsController,
  getPastCompletedOrderHistoryGroupListController,
  addProductItemIntoCurrentActiveCartController,
  deleteProductItemFromCurrentActiveCartController,
  completeCurrentActiveCartIntoPastCompletedOrderController
} = require("../controllers/shoppingCartController");

const shoppingCartRouter = express.Router();

// I protect cart endpoints so each logged user can track own current cart state.
shoppingCartRouter.use(requireAuthenticatedSessionUserMiddleware);

shoppingCartRouter.get("/current-active", getCurrentActiveCartItemsController);
shoppingCartRouter.get(
  "/past-order-history",
  getPastCompletedOrderHistoryGroupListController
);
shoppingCartRouter.post("/items", addProductItemIntoCurrentActiveCartController);
shoppingCartRouter.delete(
  "/items/:productIdValue",
  deleteProductItemFromCurrentActiveCartController
);
shoppingCartRouter.post(
  "/current-active/complete-as-order",
  completeCurrentActiveCartIntoPastCompletedOrderController
);

module.exports = {
  shoppingCartRouter
};
