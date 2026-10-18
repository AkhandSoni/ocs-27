import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const database = path.join(
  tmpdir(),
  `ocs-browser-${process.pid}-${Date.now()}.sqlite`,
);
process.env.OCS_BROWSER_TEST_DATABASE = database;
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120000,
  expect: { timeout: 30000 },
  workers: 1,
  reporter: "list",
  globalTeardown: "./tests/browser/teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: [
        "--no-sandbox",
        "--enable-unsafe-webgpu",
        "--enable-unsafe-swiftshader",
        "--use-angle=swiftshader",
      ],
    },
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next ${process.env.OCS_E2E_PRODUCTION === "1" ? "start" : "dev"} --hostname 127.0.0.1 --port 3100`,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: { OCS_AUTH_DATABASE: database },
  },
});
