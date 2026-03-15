import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useApplicationAuthenticationSessionContext } from "./ApplicationAuthenticationSessionContextProvider";
import {
  addProductItemIntoCurrentActiveCartRequest,
  completeCurrentActiveCartIntoPastCompletedOrderRequest,
  deleteProductItemFromCurrentActiveCartByIdRequest,
  getCurrentActiveCartItemsRequest
} from "../services/applicationShoppingCartHttpService";

const ApplicationShoppingCartTrackingContextObject = createContext(null);

function ApplicationShoppingCartTrackingContextProvider({ children }) {
  const {
    isAuthenticatedSessionActiveStateValue,
    isAuthenticatedSessionStatusLoadingState
  } = useApplicationAuthenticationSessionContext();

  const [
    currentActiveCartItemsListState,
    setCurrentActiveCartItemsListState
  ] = useState([]);
  const [
    currentActiveCartTotalQuantityState,
    setCurrentActiveCartTotalQuantityState
  ] = useState(0);
  const [
    isShoppingCartTrackingRequestLoadingState,
    setIsShoppingCartTrackingRequestLoadingState
  ] = useState(false);
  const [
    shoppingCartTrackingRequestErrorMessageState,
    setShoppingCartTrackingRequestErrorMessageState
  ] = useState("");

  const applyCurrentActiveCartResponseDataIntoStateAction = useCallback(
    (currentActiveCartResponseDataObjectValue) => {
      setCurrentActiveCartItemsListState(
        currentActiveCartResponseDataObjectValue.currentActiveCartItemsListValue ||
          []
      );
      setCurrentActiveCartTotalQuantityState(
        Number(
          currentActiveCartResponseDataObjectValue.currentActiveCartTotalQuantityValue ||
            0
        )
      );
    },
    []
  );

  const clearShoppingCartTrackingStateAction = useCallback(() => {
    setCurrentActiveCartItemsListState([]);
    setCurrentActiveCartTotalQuantityState(0);
    setShoppingCartTrackingRequestErrorMessageState("");
  }, []);

  const refreshCurrentActiveCartItemsFromBackendAction = useCallback(async () => {
    if (!isAuthenticatedSessionActiveStateValue) {
      clearShoppingCartTrackingStateAction();
      return;
    }

    try {
      setIsShoppingCartTrackingRequestLoadingState(true);
      setShoppingCartTrackingRequestErrorMessageState("");

      const currentActiveCartResponseDataObjectValue =
        await getCurrentActiveCartItemsRequest();
      applyCurrentActiveCartResponseDataIntoStateAction(
        currentActiveCartResponseDataObjectValue
      );
    } catch (error) {
      if (error.httpStatusCodeValue === 401) {
        clearShoppingCartTrackingStateAction();
        return;
      }

      setShoppingCartTrackingRequestErrorMessageState(
        error.message || "Current active cart request failed."
      );
    } finally {
      setIsShoppingCartTrackingRequestLoadingState(false);
    }
  }, [
    isAuthenticatedSessionActiveStateValue,
    clearShoppingCartTrackingStateAction,
    applyCurrentActiveCartResponseDataIntoStateAction
  ]);

  const addProductItemIntoCurrentActiveCartFromBackendAction = useCallback(
    async ({ productIdValue, quantityValue }) => {
      const addProductItemIntoCurrentActiveCartResponseDataObjectValue =
        await addProductItemIntoCurrentActiveCartRequest({
          productIdValue,
          quantityValue
        });

      applyCurrentActiveCartResponseDataIntoStateAction(
        addProductItemIntoCurrentActiveCartResponseDataObjectValue
      );

      return addProductItemIntoCurrentActiveCartResponseDataObjectValue;
    },
    [applyCurrentActiveCartResponseDataIntoStateAction]
  );

  const deleteProductItemFromCurrentActiveCartByIdFromBackendAction = useCallback(
    async (productIdValue) => {
      const deleteProductItemFromCurrentActiveCartResponseDataObjectValue =
        await deleteProductItemFromCurrentActiveCartByIdRequest(productIdValue);

      applyCurrentActiveCartResponseDataIntoStateAction(
        deleteProductItemFromCurrentActiveCartResponseDataObjectValue
      );

      return deleteProductItemFromCurrentActiveCartResponseDataObjectValue;
    },
    [applyCurrentActiveCartResponseDataIntoStateAction]
  );

  const completeCurrentActiveCartIntoPastCompletedOrderFromBackendAction =
    useCallback(async () => {
      // I call checkout complete endpoint and then sync current cart state from response.
      const completeCurrentActiveCartIntoPastCompletedOrderResponseDataObjectValue =
        await completeCurrentActiveCartIntoPastCompletedOrderRequest();

      applyCurrentActiveCartResponseDataIntoStateAction(
        completeCurrentActiveCartIntoPastCompletedOrderResponseDataObjectValue
      );

      return completeCurrentActiveCartIntoPastCompletedOrderResponseDataObjectValue;
    }, [applyCurrentActiveCartResponseDataIntoStateAction]);

  useEffect(() => {
    // After auth status known, I sync cart from backend only for logged user.
    if (isAuthenticatedSessionStatusLoadingState) {
      return;
    }

    if (!isAuthenticatedSessionActiveStateValue) {
      clearShoppingCartTrackingStateAction();
      return;
    }

    refreshCurrentActiveCartItemsFromBackendAction();
  }, [
    isAuthenticatedSessionStatusLoadingState,
    isAuthenticatedSessionActiveStateValue,
    clearShoppingCartTrackingStateAction,
    refreshCurrentActiveCartItemsFromBackendAction
  ]);

  const applicationShoppingCartTrackingContextValueObject = useMemo(
    () => ({
      currentActiveCartItemsListState,
      currentActiveCartTotalQuantityState,
      isShoppingCartTrackingRequestLoadingState,
      shoppingCartTrackingRequestErrorMessageState,
      refreshCurrentActiveCartItemsFromBackendAction,
      addProductItemIntoCurrentActiveCartFromBackendAction,
      deleteProductItemFromCurrentActiveCartByIdFromBackendAction,
      completeCurrentActiveCartIntoPastCompletedOrderFromBackendAction,
      clearShoppingCartTrackingStateAction
    }),
    [
      currentActiveCartItemsListState,
      currentActiveCartTotalQuantityState,
      isShoppingCartTrackingRequestLoadingState,
      shoppingCartTrackingRequestErrorMessageState,
      refreshCurrentActiveCartItemsFromBackendAction,
      addProductItemIntoCurrentActiveCartFromBackendAction,
      deleteProductItemFromCurrentActiveCartByIdFromBackendAction,
      completeCurrentActiveCartIntoPastCompletedOrderFromBackendAction,
      clearShoppingCartTrackingStateAction
    ]
  );

  return (
    <ApplicationShoppingCartTrackingContextObject.Provider
      value={applicationShoppingCartTrackingContextValueObject}
    >
      {children}
    </ApplicationShoppingCartTrackingContextObject.Provider>
  );
}

function useApplicationShoppingCartTrackingContext() {
  const applicationShoppingCartTrackingContextValueObject = useContext(
    ApplicationShoppingCartTrackingContextObject
  );

  if (!applicationShoppingCartTrackingContextValueObject) {
    throw new Error(
      "useApplicationShoppingCartTrackingContext must be used inside ApplicationShoppingCartTrackingContextProvider."
    );
  }

  return applicationShoppingCartTrackingContextValueObject;
}

export {
  ApplicationShoppingCartTrackingContextProvider,
  useApplicationShoppingCartTrackingContext
};
