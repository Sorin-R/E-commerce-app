function ApplicationSimplePageTemplateLayout({
  pageTitleTextValue,
  pageDescriptionTextValue,
  children
}) {
  return (
    <section className="ecommerce-application-shared-page-template-wrapper-section-container">
      <header className="ecommerce-application-shared-page-template-header-area-container">
        <h2 className="ecommerce-application-shared-page-template-main-title-text">
          {pageTitleTextValue}
        </h2>
        <p className="ecommerce-application-shared-page-template-description-text">
          {pageDescriptionTextValue}
        </p>
      </header>

      {/* This children is real page content area from each specific page. */}
      <div className="ecommerce-application-shared-page-template-content-body-container">
        {children}
      </div>
    </section>
  );
}

export default ApplicationSimplePageTemplateLayout;
