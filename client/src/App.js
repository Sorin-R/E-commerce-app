import "./styles/applicationHomePageStyles.css";

function App() {
  return (
    <div className="ecommerce-application-main-shell-container">
      <header className="ecommerce-application-header-section-container">
        <h1 className="ecommerce-application-title-text">
          E-Commerce Application Frontend
        </h1>
        <p className="ecommerce-application-subtitle-text">
          React project is ready. Next we add routes and real pages.
        </p>
      </header>

      <main className="ecommerce-application-content-section-container">
        <section className="ecommerce-application-feature-preview-card-container">
          <h2 className="ecommerce-application-feature-card-title-text">
            Project Structure Prepared
          </h2>
          <p className="ecommerce-application-feature-card-description-text">
            We have folders for pages, components, services, context and styles.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
