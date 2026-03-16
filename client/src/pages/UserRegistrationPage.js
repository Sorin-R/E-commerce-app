import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";
import { useApplicationAuthenticationSessionContext } from "../context/ApplicationAuthenticationSessionContextProvider";
import { registerWithUsernameAndPasswordRequest } from "../services/applicationAuthenticationHttpService";

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

  const handleRegistrationFormFieldValueChangeAction = (event) => {
    const { name, value } = event.target;

    setRegistrationFormFieldValuesState(
      (previousRegistrationFormFieldValuesState) => ({
        ...previousRegistrationFormFieldValuesState,
        [name]: value
      })
    );
  };

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
        className="ecommerce-application-user-registration-page-form-layout-container"
        onSubmit={handleRegistrationFormSubmitAction}
      >
        <label
          className="ecommerce-application-user-registration-page-username-field-group-container"
          htmlFor="registrationUserNameInputField"
        >
          Username
          <input
            id="registrationUserNameInputField"
            className="ecommerce-application-user-registration-page-username-input-field-element"
            type="text"
            name="username"
            placeholder="Write your username"
            value={registrationFormFieldValuesState.username}
            onChange={handleRegistrationFormFieldValueChangeAction}
            autoComplete="username"
          />
        </label>

        <label
          className="ecommerce-application-user-registration-page-password-field-group-container"
          htmlFor="registrationPasswordInputField"
        >
          Password
          <input
            id="registrationPasswordInputField"
            className="ecommerce-application-user-registration-page-password-input-field-element"
            type="password"
            name="password"
            placeholder="Write your password"
            value={registrationFormFieldValuesState.password}
            onChange={handleRegistrationFormFieldValueChangeAction}
            autoComplete="new-password"
          />
        </label>

        {registrationErrorMessageState ? (
          <p className="ecommerce-application-user-registration-page-feedback-error-message-box">
            {registrationErrorMessageState}
          </p>
        ) : null}

        {registrationSuccessMessageState ? (
          <p className="ecommerce-application-user-registration-page-feedback-success-message-box">
            {registrationSuccessMessageState}
          </p>
        ) : null}

        <button
          className="ecommerce-application-user-registration-page-submit-registration-button-element"
          type="submit"
          disabled={isRegistrationFormSubmissionLoadingState}
        >
          {isRegistrationFormSubmissionLoadingState
            ? "Registering now..."
            : "Register Account"}
        </button>
      </form>

      <p className="ecommerce-application-user-registration-page-login-helper-text-line">
        Already have account?
        {" "}
        <Link
          className="ecommerce-application-user-registration-page-login-inline-link-element"
          to="/login"
        >
          Login from here
        </Link>
      </p>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default UserRegistrationPage;
