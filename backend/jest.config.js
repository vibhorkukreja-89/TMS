/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["@swc/jest"],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  // Runs before any module is loaded — redirects to test DB if DATABASE_URL_TEST is set
  setupFiles: ["./jest.setup.js"],
  forceExit: true,
};
