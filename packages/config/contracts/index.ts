export * from "./type"

import { createLocalConfig } from "./envs/local"
import { createSoloStagingConfig } from "./envs/soloStaging"
import { createTestnetConfig } from "./envs/testnet"
import { createE2EConfig } from "./envs/e2e"

export const EnvConfigValues = ["local", "e2e", "solo-staging", "testnet"] as const
export type EnvConfig = (typeof EnvConfigValues)[number]

export function getContractsConfig(env: EnvConfig) {
  switch (env) {
    case "local":
      return createLocalConfig()
    case "e2e":
      return createE2EConfig()
    case "solo-staging":
      return createSoloStagingConfig()
    case "testnet":
      return createTestnetConfig()

    default:
      throw new Error(`Invalid ENV "${env}"`)
  }
}

export function shouldRunSimulation() {
  return process.env.NEXT_PUBLIC_APP_ENV == "local" && process.env.RUN_SIMULATION === "true"
}

export function isE2E() {
  return process.env.NEXT_PUBLIC_APP_ENV == "e2e"
}
