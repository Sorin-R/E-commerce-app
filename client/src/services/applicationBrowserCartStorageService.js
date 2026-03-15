const ecommerceApplicationCartStorageKeyValue =
  "ecommerce_application_cart_storage_items_key";

export function addProductItemToBrowserCartStorage({
  productIdValue,
  productNameValue,
  productImageUrlValue,
  productUnitPriceAmountValue,
  productCurrencyCodeValue
}) {
  const existingCartItemListValue = readCartItemListFromBrowserStorageSafely();

  const foundCartItemIndexValue = existingCartItemListValue.findIndex(
    (cartItemObjectValue) =>
      Number(cartItemObjectValue.productIdValue) === Number(productIdValue)
  );

  if (foundCartItemIndexValue >= 0) {
    existingCartItemListValue[foundCartItemIndexValue].quantityValue += 1;
  } else {
    existingCartItemListValue.push({
      productIdValue,
      productNameValue,
      productImageUrlValue: productImageUrlValue || null,
      productUnitPriceAmountValue: productUnitPriceAmountValue || null,
      productCurrencyCodeValue: productCurrencyCodeValue || "USD",
      quantityValue: 1
    });
  }

  saveCartItemListToBrowserStorageSafely(existingCartItemListValue);

  return {
    cartItemListValue: existingCartItemListValue,
    updatedCartTotalQuantityValue: calculateCartTotalQuantityValue(
      existingCartItemListValue
    )
  };
}

function readCartItemListFromBrowserStorageSafely() {
  if (!isBrowserWindowAvailableNow()) {
    return [];
  }

  const rawCartStorageTextValue = window.localStorage.getItem(
    ecommerceApplicationCartStorageKeyValue
  );

  if (!rawCartStorageTextValue) {
    return [];
  }

  try {
    const parsedCartStorageValue = JSON.parse(rawCartStorageTextValue);
    return Array.isArray(parsedCartStorageValue) ? parsedCartStorageValue : [];
  } catch {
    return [];
  }
}

function saveCartItemListToBrowserStorageSafely(cartItemListValue) {
  if (!isBrowserWindowAvailableNow()) {
    return;
  }

  // I save cart list in localStorage so refresh page keep cart items value.
  window.localStorage.setItem(
    ecommerceApplicationCartStorageKeyValue,
    JSON.stringify(cartItemListValue)
  );
}

function calculateCartTotalQuantityValue(cartItemListValue) {
  return cartItemListValue.reduce(
    (runningCartTotalQuantityValue, cartItemObjectValue) =>
      runningCartTotalQuantityValue + Number(cartItemObjectValue.quantityValue),
    0
  );
}

function isBrowserWindowAvailableNow() {
  return typeof window !== "undefined";
}
