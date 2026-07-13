/**
 * Runs before any test module is imported.
 * If DATABASE_URL_TEST is set, redirect DATABASE_URL to it so that
 * tests never touch the development database.
 * See tms-testing.mdc: "Never run tests against the development database."
 */
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
