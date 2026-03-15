function ApplicationProductDetailsInformationForDetailsPage({
  productDetailsPayloadObjectValue
}) {
  return (
    <article className="ecommerce-application-product-details-page-main-information-card-container">
      <div className="ecommerce-application-product-details-page-main-information-card-image-wrapper-container">
        <img
          className="ecommerce-application-product-details-page-main-information-card-image-element"
          src={
            productDetailsPayloadObjectValue.imageUrl ||
            "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
          }
          alt={buildProductDetailsImageAlternativeTextValue(
            productDetailsPayloadObjectValue.name
          )}
        />
      </div>

      <div className="ecommerce-application-product-details-page-main-information-card-content-wrapper-container">
        <h3 className="ecommerce-application-product-details-page-main-information-card-title-text">
          {productDetailsPayloadObjectValue.name}
        </h3>

        <p className="ecommerce-application-product-details-page-main-information-card-short-description-text-line">
          {productDetailsPayloadObjectValue.description}
        </p>

        <p className="ecommerce-application-product-details-page-main-information-card-detailed-description-text-line">
          {productDetailsPayloadObjectValue.detailedDescriptionText}
        </p>

        <div className="ecommerce-application-product-details-page-main-information-card-meta-information-grid-container">
          <p className="ecommerce-application-product-details-page-main-information-card-meta-information-text-line">
            Product ID: {productDetailsPayloadObjectValue.id}
          </p>
          <p className="ecommerce-application-product-details-page-main-information-card-meta-information-text-line">
            Availability: {productDetailsPayloadObjectValue.availabilityStatusText}
          </p>
          <p className="ecommerce-application-product-details-page-main-information-card-meta-information-text-line">
            Price:
            {" "}
            {buildProductDisplayPriceTextValue(productDetailsPayloadObjectValue)}
          </p>
        </div>
      </div>
    </article>
  );
}

function buildProductDisplayPriceTextValue(productDetailsPayloadObjectValue) {
  if (
    typeof productDetailsPayloadObjectValue.unitPriceAmount === "number" &&
    Number.isFinite(productDetailsPayloadObjectValue.unitPriceAmount)
  ) {
    return `${productDetailsPayloadObjectValue.currencyCode} ${productDetailsPayloadObjectValue.unitPriceAmount.toFixed(2)}`;
  }

  return "Price not available";
}

function buildProductDetailsImageAlternativeTextValue(productNameValue) {
  // I keep image alt text simple and clear for screen readers.
  return `${productNameValue} details image`;
}

export default ApplicationProductDetailsInformationForDetailsPage;
