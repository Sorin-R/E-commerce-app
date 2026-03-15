const express = require("express");
const {
  getProductCatalogListController,
  getSingleProductDetailsByIdController
} = require("../controllers/productCatalogController");

const productCatalogRouter = express.Router();

// This route provide product data for React products listing page.
productCatalogRouter.get("/", getProductCatalogListController);
productCatalogRouter.get("/:productId", getSingleProductDetailsByIdController);

module.exports = {
  productCatalogRouter
};
