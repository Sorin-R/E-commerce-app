import ApplicationSimplePageTemplateLayout from "../components/ApplicationSimplePageTemplateLayout";

function UserRegistrationPage() {
  return (
    <ApplicationSimplePageTemplateLayout
      pageTitleTextValue="Create New Account"
      pageDescriptionTextValue="This page is ready for registration form logic in next step."
    >
      {/* This register form is placeholder now, full API logic comes next task. */}
      <form className="ecommerce-application-user-registration-page-form-layout-container">
        <label
          className="ecommerce-application-user-registration-page-username-field-group-container"
          htmlFor="registrationUserNameInputField"
        >
          Username
          <input
            id="registrationUserNameInputField"
            className="ecommerce-application-user-registration-page-username-input-field-element"
            type="text"
            placeholder="Write your username"
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
            placeholder="Write your password"
          />
        </label>

        <button
          className="ecommerce-application-user-registration-page-submit-registration-button-element"
          type="button"
        >
          Register Account
        </button>
      </form>
    </ApplicationSimplePageTemplateLayout>
  );
}

export default UserRegistrationPage;
