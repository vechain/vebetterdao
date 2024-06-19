export * from "./type"

import { createLocalConfig } from "./envs/local"
import { createSoloStagingConfig } from "./envs/soloStaging"
import { createE2EConfig } from "./envs/e2e"
import { createTestnetConfig } from "./envs/testnet"
import { createMainnetConfig } from "./envs/mainnet"

export const EnvConfigValues = ["local", "e2e", "solo-staging", "testnet", "mainnet"] as const
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
    case "mainnet":
      return createMainnetConfig()

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
