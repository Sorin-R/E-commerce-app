import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { registerWithUsernameAndPasswordRequest } from "../services/applicationAuthenticationHttpService";

// I make this function for UserRegistrationPage logic here.
function UserRegistrationPage() {
  const [registrationFormFieldValuesState, setRegistrationFormFieldValuesState] =
    useState({
      username: "",
      password: ""
    });
  const [
    isRegistrationFormSubmissionLoadingState,
    setIsRegistrationFormSubmissionLoadingState
  ] = useState(false);
  const [registrationErrorMessageState, setRegistrationErrorMessageState] =
    useState("");
  const [registrationSuccessMessageState, setRegistrationSuccessMessageState] =
    useState("");
  const navigate = useNavigate();
  const { setAuthenticatedSessionUserFromLoginResponseAction } =
    useApplicationAuthenticationSessionContext();

  // I make this function for handleRegistrationFormFieldValueChangeAction logic here.
  const handleRegistrationFormFieldValueChangeAction = (event) => {
    const { name, value } = event.target;

    setRegistrationFormFieldValuesState(
      (previousRegistrationFormFieldValuesState) => ({
        ...previousRegistrationFormFieldValuesState,
        [name]: value
      })
    );
  };

  // I make this function for handleRegistrationFormSubmitAction logic here.
  const handleRegistrationFormSubmitAction = async (event) => {
    event.preventDefault();
    setRegistrationErrorMessageState("");
    setRegistrationSuccessMessageState("");

    if (
      !registrationFormFieldValuesState.username ||
      !registrationFormFieldValuesState.password
    ) {
      setRegistrationErrorMessageState("Please write username and password first.");
      return;
    }

    try {
      setIsRegistrationFormSubmissionLoadingState(true);

      const registerResponseData = await registerWithUsernameAndPasswordRequest({
        username: registrationFormFieldValuesState.username,
        password: registrationFormFieldValuesState.password
      });

      setAuthenticatedSessionUserFromLoginResponseAction(registerResponseData.user);
      setRegistrationSuccessMessageState(
        registerResponseData.message || "Register is successful now."
      );
      navigate("/products", { replace: true });
    } catch (error) {
      setRegistrationErrorMessageState(
        error.message || "Register request failed."
      );
    } finally {
      setIsRegistrationFormSubmissionLoadingState(false);
    }
  };

  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Create New Account"
      pageDescriptionTextValue="Create account with username and password to start shopping."
    >
      <form
        className="ecom-app-user-register-page-form-layout-box"
        onSubmit={handleRegistrationFormSubmitAction}
      >
        <label
          className="ecom-app-user-reg-page-username-field-group-box"
          htmlFor="registrationUserNameInputField"
        >
          Username
          <input
            id="registrationUserNameInputField"
            className="ecom-app-user-reg-page-username-input-field-el"
            type="text"
            name="username"
            placeholder="Write your username"
            value={registrationFormFieldValuesState.username}
            onChange={handleRegistrationFormFieldValueChangeAction}
            autoComplete="username"
          />
        </label>

        <label
          className="ecom-app-user-reg-page-password-field-group-box"
          htmlFor="registrationPasswordInputField"
        >
          Password
          <input
            id="registrationPasswordInputField"
            className="ecom-app-user-reg-page-password-input-field-el"
            type="password"
            name="password"
            placeholder="Write your password"
            value={registrationFormFieldValuesState.password}
            onChange={handleRegistrationFormFieldValueChangeAction}
            autoComplete="new-password"
          />
        </label>

        {registrationErrorMessageState ? (
          <p className="ecom-app-user-register-page-feedback-error-msg-box">
            {registrationErrorMessageState}
          </p>
        ) : null}

        {registrationSuccessMessageState ? (
          <p className="ecom-app-user-reg-page-fb-ok-msg-box">
            {registrationSuccessMessageState}
          </p>
        ) : null}

        <button
          className="ecom-app-user-register-page-submit-register-btn-el"
          type="submit"
          disabled={isRegistrationFormSubmissionLoadingState}
        >
          {isRegistrationFormSubmissionLoadingState
            ? "Registering now..."
            : "Register Account"}
        </button>
      </form>

      <p className="ecom-app-user-register-page-login-helper-text-line">
        Already have account?
        {" "}
        <Link
          className="ecom-app-user-register-page-login-inline-link-el"
          to="/login"
        >
          Login from here
        </Link>
      </p>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default UserRegistrationPage;
