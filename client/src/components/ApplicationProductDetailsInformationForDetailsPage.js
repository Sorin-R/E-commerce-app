// I make this function for ApplicationProductDetailsInformationForDetailsPage logic here.
function ApplicationProductDetailsInformationForDetailsPage({
  productDetailsPayloadObjectValue
}) {
  return (
    <article className="ecom-app-product-details-page-main-info-card-box">
      <div className="ecom-app-prod-det-page-main-info-image-wrap-box">
        <img
          className="ecom-app-prod-det-page-main-info-card-image-el"
          src={
            productDetailsPayloadObjectValue.imageUrl ||
            "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80"
          }
          alt={buildProductDetailsImageAlternativeTextValue(
            productDetailsPayloadObjectValue.name
          )}
        />
      </div>

      <div className="ecom-app-prod-det-page-main-info-content-wrap">
        <h3 className="ecom-app-prod-det-page-main-info-card-title-text">
          {productDetailsPayloadObjectValue.name}
        </h3>

        <p className="ecom-app-prod-det-page-main-info-short-desc-text">
          {productDetailsPayloadObjectValue.description}
        </p>

        <p className="ecom-app-prod-det-page-main-info-detail-desc-text">
          {productDetailsPayloadObjectValue.detailedDescriptionText}
        </p>

        <div className="ecom-app-prod-det-page-main-info-meta-grid-box">
          <p className="ecom-app-prod-det-page-main-info-meta-text-line">
            Product ID: {productDetailsPayloadObjectValue.id}
          </p>
          <p className="ecom-app-prod-det-page-main-info-meta-text-line">
            Availability: {productDetailsPayloadObjectValue.availabilityStatusText}
          </p>
          <p className="ecom-app-prod-det-page-main-info-meta-text-line">
            Price:
            {" "}
            {buildProductDisplayPriceTextValue(productDetailsPayloadObjectValue)}
          </p>
        </div>
      </div>
    </article>
  );
}

// I make this function for buildProductDisplayPriceTextValue logic here.
function buildProductDisplayPriceTextValue(productDetailsPayloadObjectValue) {
  if (
    typeof productDetailsPayloadObjectValue.unitPriceAmount === "number" &&
    Number.isFinite(productDetailsPayloadObjectValue.unitPriceAmount)
  ) {
    return `${productDetailsPayloadObjectValue.currencyCode} ${productDetailsPayloadObjectValue.unitPriceAmount.toFixed(2)}`;
  }

  return "Price not available";
}

// I make this function for buildProductDetailsImageAlternativeTextValue logic here.
function buildProductDetailsImageAlternativeTextValue(productNameValue) {
  // I keep image alt text simple and clear for screen readers.
  return `${productNameValue} details image`;
}

export default ApplicationProductDetailsInformationForDetailsPage;
