// I make this function for ApplicationSimplePageTemplateLayout logic here.
function ApplicationSimplePageTemplateLayout({
  pageTitleTextValue,
  pageDescriptionTextValue,
  children
}) {
  return (
    <section className="ecom-app-shared-page-wrap-section-box">
      <header className="ecom-app-shared-page-header-area-box">
        <h2 className="ecom-app-shared-page-main-title-text">
          {pageTitleTextValue}
        </h2>
        <p className="ecom-app-shared-page-desc-text">
          {pageDescriptionTextValue}
        </p>
      </header>

      {/* This children is real page content area from each specific page. */}
      <div className="ecom-app-shared-page-content-body-box">
        {children}
      </div>
    </section>
  );
}

export default ApplicationSimplePageTemplateLayout;
