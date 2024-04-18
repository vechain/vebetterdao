export * from "./type"

import { createLocalConfig } from "./envs/local"
import { createSoloStagingConfig } from "./envs/soloStaging"
import { createTestnetConfig } from "./envs/testnet"
import { createE2EConfig } from "./envs/e2e"

export function getContractsConfig() {
  switch (process.env.NEXT_PUBLIC_APP_ENV) {
    case "local":
      return createLocalConfig()
    case "e2e":
      return createE2EConfig()
    case "solo-staging":
      return createSoloStagingConfig()
    case "testnet":
      return createTestnetConfig()
    case "production":
      throw "Production contracts config are not implemented yet"

    default:
      throw new Error(`Invalid NEXT_PUBLIC_APP_ENV "${process.env.NEXT_PUBLIC_APP_ENV}"`)
  }
}

export function shouldRunSimulation() {
  return process.env.NEXT_PUBLIC_APP_ENV == "local" && process.env.RUN_SIMULATION === "true"
}
