const { Pool } = require("pg");

// I create one shared pool connection so all controllers can query database.
const postgresDatabasePoolConnection = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/ecommerce_application_database",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

module.exports = {
  postgresDatabasePoolConnection
};
