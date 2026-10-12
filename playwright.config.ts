import { defineConfig, devices } from "@playwright/test";

/**
 * NextGen waves e2e suite. Runs against the self-contained preview.html
 * (build it first: node scripts/nextgen-waves/build-preview.mjs).
 */
export default defineConfig({
  testDir: "tests/nextgen-waves",
  outputDir: "test-results/nextgen-waves",
  timeout: 60_000,
  fullyParallel: false,
  workers: 2,
  reporter: [["list"]],
  projects: [
    {
      name: "desktop",
      testMatch: /(desktop|shaders|reduced|fallback|contextloss|leak)\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "iphone-13",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPhone 13"] }, // WebKit
    },
    {
      name: "pixel-7",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"] }, // Chromium
    },
    {
      name: "perf",
      testMatch: /perf\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        // the real GPU (ANGLE → Metal), so frame times reflect the CPU throttle, not software rasterisation
        launchOptions: { args: ["--use-angle=metal", "--ignore-gpu-blocklist"] },
      },
    },
  ],
});
