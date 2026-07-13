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
  forceExit: true,
  detectOpenHandles: true,
};
