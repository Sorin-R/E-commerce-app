import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getAuthenticatedSessionStatusRequest,
  logoutAuthenticatedSessionUserRequest
} from "../services/applicationAuthenticationHttpService";

const ApplicationAuthenticationSessionContextObject = createContext(null);

function ApplicationAuthenticationSessionContextProvider({ children }) {
  const [authenticatedSessionUserPayloadState, setAuthenticatedSessionUserPayloadState] =
    useState(null);
  const [
    isAuthenticatedSessionStatusLoadingState,
    setIsAuthenticatedSessionStatusLoadingState
  ] = useState(true);
  const [
    authenticatedSessionSupportErrorMessageState,
    setAuthenticatedSessionSupportErrorMessageState
  ] = useState("");

  const refreshAuthenticatedSessionStatusFromBackendAction = useCallback(
    async () => {
      try {
        setIsAuthenticatedSessionStatusLoadingState(true);
        setAuthenticatedSessionSupportErrorMessageState("");

        const sessionStatusResponseData =
          await getAuthenticatedSessionStatusRequest();

        if (sessionStatusResponseData.isAuthenticatedSessionActive) {
          setAuthenticatedSessionUserPayloadState(
            sessionStatusResponseData.user || null
          );
        } else {
          setAuthenticatedSessionUserPayloadState(null);
        }
      } catch (error) {
        // If session check fail, I keep user null and save message for debugging help.
        setAuthenticatedSessionUserPayloadState(null);
        setAuthenticatedSessionSupportErrorMessageState(
          error.message || "Session support check request failed."
        );
      } finally {
        setIsAuthenticatedSessionStatusLoadingState(false);
      }
    },
    []
  );

  const setAuthenticatedSessionUserFromLoginResponseAction = useCallback(
    (authenticatedSessionUserPayloadObject) => {
      // This function is called after login success so UI update immediate.
      setAuthenticatedSessionUserPayloadState(authenticatedSessionUserPayloadObject);
      setAuthenticatedSessionSupportErrorMessageState("");
    },
    []
  );

  const logoutAuthenticatedSessionUserFromBackendAction = useCallback(
    async () => {
      try {
        await logoutAuthenticatedSessionUserRequest();
      } catch (error) {
        // If backend says 401, it means session already gone, so I still clear local user state.
        if (error.httpStatusCodeValue !== 401) {
          throw error;
        }
      } finally {
        setAuthenticatedSessionUserPayloadState(null);
      }
    },
    []
  );

  useEffect(() => {
    // On app first load, I check if user already have active session cookie.
    refreshAuthenticatedSessionStatusFromBackendAction();
  }, [refreshAuthenticatedSessionStatusFromBackendAction]);

  const applicationAuthenticationSessionContextValueObject = useMemo(
    () => ({
      authenticatedSessionUserPayloadState,
      isAuthenticatedSessionActiveStateValue: Boolean(
        authenticatedSessionUserPayloadState
      ),
      isAuthenticatedSessionStatusLoadingState,
      authenticatedSessionSupportErrorMessageState,
      refreshAuthenticatedSessionStatusFromBackendAction,
      setAuthenticatedSessionUserFromLoginResponseAction,
      logoutAuthenticatedSessionUserFromBackendAction
    }),
    [
      authenticatedSessionUserPayloadState,
      isAuthenticatedSessionStatusLoadingState,
      authenticatedSessionSupportErrorMessageState,
      refreshAuthenticatedSessionStatusFromBackendAction,
      setAuthenticatedSessionUserFromLoginResponseAction,
      logoutAuthenticatedSessionUserFromBackendAction
    ]
  );

  return (
    <ApplicationAuthenticationSessionContextObject.Provider
      value={applicationAuthenticationSessionContextValueObject}
    >
      {children}
    </ApplicationAuthenticationSessionContextObject.Provider>
  );
}

function useApplicationAuthenticationSessionContext() {
  const applicationAuthenticationSessionContextValueObject = useContext(
    ApplicationAuthenticationSessionContextObject
  );

  if (!applicationAuthenticationSessionContextValueObject) {
    throw new Error(
      "useApplicationAuthenticationSessionContext must be used inside ApplicationAuthenticationSessionContextProvider."
    );
  }

  return applicationAuthenticationSessionContextValueObject;
}

export {
  ApplicationAuthenticationSessionContextProvider,
  useApplicationAuthenticationSessionContext
};
