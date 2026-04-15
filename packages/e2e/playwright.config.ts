import { existsSync } from "node:fs"
import path from "node:path"

import { defineConfig } from "@playwright/test"

import { baseUrl, repoRoot } from "./src/config"

const envFilePath = existsSync(path.join(repoRoot, ".env"))
  ? path.join(repoRoot, ".env")
  : path.join(repoRoot, ".env.example")
const appPort = new URL(baseUrl).port || "3000"

const webServerCommand = [
  `dotenv -v NEXT_PUBLIC_APP_ENV=e2e -e "${envFilePath}" -- yarn workspace @repo/config check-or-generate-local-config`,
  `dotenv -v NEXT_PUBLIC_APP_ENV=e2e -v ENDORSE_XAPPS=true -v PORT=${appPort} -e "${envFilePath}" -- yarn workspace frontend dev`,
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
    trace: "on-first-retry",
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
          timeout: 240_000,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
          stderr: "pipe",
        },
})
