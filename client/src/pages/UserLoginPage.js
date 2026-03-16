import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import {
  loginWithUsernameAndPasswordRequest,
  redirectToThirdPartyProviderAuthentication
} from "../services/applicationAuthenticationHttpService";

// I make this function for UserLoginPage logic here.
function UserLoginPage() {
  // I keep all input values in one state object for easy handle form.
  const [loginFormFieldValuesState, setLoginFormFieldValuesState] = useState({
    username: "",
    password: ""
  });
  // This loading state help me block multi submit click from user.
  const [isLoginFormSubmissionLoadingState, setIsLoginFormSubmissionLoadingState] =
    useState(false);
  // Error and success message state for show feedback in page.
  const [loginErrorMessageState, setLoginErrorMessageState] = useState("");
  const [loginSuccessMessageState, setLoginSuccessMessageState] = useState("");
  const [loginPageSearchParamsObject] = useSearchParams();
  const loginPageCurrentLocationObject = useLocation();
  const navigate = useNavigate();
  const redirectAfterLoginPathValue =
    loginPageCurrentLocationObject.state?.redirectAfterLoginPathValue || "/";
  const {
    setAuthenticatedSessionUserFromLoginResponseAction,
    refreshAuthenticatedSessionStatusFromBackendAction
  } = useApplicationAuthenticationSessionContext();

  useEffect(() => {
    // After OAuth callback backend redirect user here with status query params.
    const oauthStatusValue = loginPageSearchParamsObject.get("oauth_status");
    const oauthProviderNameValue = loginPageSearchParamsObject.get("provider");
    const oauthErrorCodeValue =
      loginPageSearchParamsObject.get("oauth_error_code");

    if (oauthStatusValue === "success") {
      setLoginErrorMessageState("");
      setLoginSuccessMessageState(
        `Login with ${getReadableThirdPartyProviderLabelText(oauthProviderNameValue)} is successful now.`
      );
      // I refresh session user from backend because OAuth return by redirect flow.
      refreshAuthenticatedSessionStatusFromBackendAction();
      return;
    }

    if (oauthStatusValue === "failed") {
      setLoginSuccessMessageState("");
      setLoginErrorMessageState(
        buildThirdPartyLoginErrorMessageText({
          oauthProviderNameValue,
          oauthErrorCodeValue
        })
      );
    }
  }, [
    loginPageSearchParamsObject,
    refreshAuthenticatedSessionStatusFromBackendAction
  ]);

  // I make this function for handleLoginFormFieldValueChange logic here.
  const handleLoginFormFieldValueChange = (event) => {
    const { name, value } = event.target;

    setLoginFormFieldValuesState((previousLoginFormFieldValuesState) => ({
      ...previousLoginFormFieldValuesState,
      [name]: value
    }));
  };

  // I make this function for handleLoginFormSubmitAction logic here.
  const handleLoginFormSubmitAction = async (event) => {
    event.preventDefault();
    setLoginErrorMessageState("");
    setLoginSuccessMessageState("");

    if (!loginFormFieldValuesState.username || !loginFormFieldValuesState.password) {
      setLoginErrorMessageState("Please write username and password first.");
      return;
    }

    try {
      setIsLoginFormSubmissionLoadingState(true);

      // I send plain password to backend and backend compare with hash safely.
      const loginResponseData = await loginWithUsernameAndPasswordRequest({
        username: loginFormFieldValuesState.username,
        password: loginFormFieldValuesState.password
      });

      setAuthenticatedSessionUserFromLoginResponseAction(loginResponseData.user);
      setLoginSuccessMessageState(
        loginResponseData.message || "Login is successful now."
      );
      navigate(redirectAfterLoginPathValue, { replace: true });
    } catch (error) {
      setLoginErrorMessageState(error.message || "Login request failed.");
    } finally {
      setIsLoginFormSubmissionLoadingState(false);
    }
  };

  // I make this function for handleThirdPartyProviderLoginClick logic here.
  const handleThirdPartyProviderLoginClick = (providerNameValue) => {
    // We redirect to backend OAuth endpoint so user can login with provider.
    redirectToThirdPartyProviderAuthentication(providerNameValue);
  };

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Sign In to Your Account"
      pageDescriptionTextValue="You can login with username and password, or continue with third-party provider."
    >
      <form
        className="ecom-app-user-login-page-form-layout-box"
        onSubmit={handleLoginFormSubmitAction}
      >
        <label
          className="ecom-app-user-login-page-username-field-group-box"
          htmlFor="loginUserNameInputField"
        >
          Username
          <input
            id="loginUserNameInputField"
            className="ecom-app-user-login-page-username-input-field-el"
            type="text"
            name="username"
            placeholder="Write your username"
            value={loginFormFieldValuesState.username}
            onChange={handleLoginFormFieldValueChange}
            autoComplete="username"
          />
        </label>

        <label
          className="ecom-app-user-login-page-password-field-group-box"
          htmlFor="loginPasswordInputField"
        >
          Password
          <input
            id="loginPasswordInputField"
            className="ecom-app-user-login-page-password-input-field-el"
            type="password"
            name="password"
            placeholder="Write your password"
            value={loginFormFieldValuesState.password}
            onChange={handleLoginFormFieldValueChange}
            autoComplete="current-password"
          />
        </label>

        {loginErrorMessageState ? (
          <p className="ecom-app-user-login-page-feedback-error-msg-box">
            {loginErrorMessageState}
          </p>
        ) : null}

        {loginSuccessMessageState ? (
          <p className="ecom-app-user-login-page-feedback-success-msg-box">
            {loginSuccessMessageState}
          </p>
        ) : null}

        <button
          className="ecom-app-user-login-page-main-login-submit-btn-el"
          type="submit"
          disabled={isLoginFormSubmissionLoadingState}
        >
          {isLoginFormSubmissionLoadingState
            ? "Logging in now..."
            : "Login with Username"}
        </button>

        <div className="ecom-app-user-login-page-third-party-btns-wrap">
          <button
            className="ecom-app-user-login-page-google-provider-btn"
            type="button"
            onClick={() => handleThirdPartyProviderLoginClick("google")}
          >
            Continue with Google
          </button>
          <button
            className="ecom-app-user-login-page-facebook-provider-btn"
            type="button"
            onClick={() => handleThirdPartyProviderLoginClick("facebook")}
          >
            Continue with Facebook
          </button>
        </div>
      </form>

      <p className="ecom-app-user-login-page-register-helper-text-line">
        Do not have account?
        {" "}
        <Link
          className="ecom-app-user-login-page-register-inline-link-el"
          to="/register"
        >
          Create new register account here
        </Link>
      </p>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default UserLoginPage;

// I make this function for getReadableThirdPartyProviderLabelText logic here.
function getReadableThirdPartyProviderLabelText(oauthProviderNameValue) {
  if (oauthProviderNameValue === "google") {
    return "Google";
  }

  if (oauthProviderNameValue === "facebook") {
    return "Facebook";
  }

  return "third-party provider";
}

// I make this function for buildThirdPartyLoginErrorMessageText logic here.
function buildThirdPartyLoginErrorMessageText({
  oauthProviderNameValue,
  oauthErrorCodeValue
}) {
  const readableProviderLabelText = getReadableThirdPartyProviderLabelText(
    oauthProviderNameValue
  );

  if (oauthErrorCodeValue === "provider_not_configured") {
    return `${readableProviderLabelText} login is not configured yet on backend env values.`;
  }

  if (oauthErrorCodeValue === "oauth_success_session_create_failed") {
    return `${readableProviderLabelText} login provider success but app session create failed. Please try again.`;
  }

  if (oauthErrorCodeValue === "oauth_user_payload_missing") {
    return `${readableProviderLabelText} login failed because user profile payload is missing. Please try again.`;
  }

  return `Login with ${readableProviderLabelText} failed. Please try again.`;
}
