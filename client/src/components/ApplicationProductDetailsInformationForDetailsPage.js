// I make this function for ApplicationProductDetailsInformationForDetailsPage logic here.
function ApplicationProductDetailsInformationForDetailsPage({
  productDetailsPayloadObjectValue
}) {
  return (
    <article className="ecom-app-product-details-page-main-info-card-box">
      <div className="ecom-app-prod-det-page-main-info-card-image-25df98">
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

      <div className="ecom-app-prod-det-page-main-info-card-conte-8b44dd">
        <h3 className="ecom-app-prod-det-page-main-info-card-title-text">
          {productDetailsPayloadObjectValue.name}
        </h3>

        <p className="ecom-app-prod-det-page-main-info-card-short-3d07a7">
          {productDetailsPayloadObjectValue.description}
        </p>

        <p className="ecom-app-prod-det-page-main-info-card-det-d-4bd146">
          {productDetailsPayloadObjectValue.detailedDescriptionText}
        </p>

        <div className="ecom-app-prod-det-page-main-info-card-meta--5bb8a7">
          <p className="ecom-app-prod-det-page-main-info-card-meta--d8fbf9">
            Product ID: {productDetailsPayloadObjectValue.id}
          </p>
          <p className="ecom-app-prod-det-page-main-info-card-meta--d8fbf9">
            Availability: {productDetailsPayloadObjectValue.availabilityStatusText}
          </p>
          <p className="ecom-app-prod-det-page-main-info-card-meta--d8fbf9">
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
