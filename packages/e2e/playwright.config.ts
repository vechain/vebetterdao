import { existsSync } from "node:fs"
import path from "node:path"

import { defineConfig } from "@playwright/test"

import { baseUrl, repoRoot } from "./src/config"

const envFilePath = existsSync(path.join(repoRoot, ".env"))
  ? path.join(repoRoot, ".env")
  : path.join(repoRoot, ".env.example")
const appPort = new URL(baseUrl).port || "3001"

const webServerCommand = [
  `dotenv -v NEXT_PUBLIC_APP_ENV=e2e -e "${envFilePath}" -- node packages/e2e/scripts/checkOrDeployE2EConfig.mjs`,
  `dotenv -v NEXT_PUBLIC_APP_ENV=e2e -v NEXT_PUBLIC_E2E_DISABLE_TYPING=true -v ENDORSE_XAPPS=true -v PORT=${appPort} -e "${envFilePath}" -- yarn workspace frontend dev`,
].join(" && ")

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer:
    process.env.B3TR_E2E_SKIP_WEB_SERVER === "true"
      ? undefined
      : {
          command: webServerCommand,
          cwd: repoRoot,
          url: baseUrl,
          timeout: 600_000,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
          stderr: "pipe",
        },
})
