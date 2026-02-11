/**
 * @type {import("@stryker-mutator/api/core").PartialStrykerOptions}
 */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  incremental: true,
  plugins: ["@stryker-mutator/vitest-runner"],
};
