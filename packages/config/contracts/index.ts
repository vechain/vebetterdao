export * from "./type"

import { createLocalConfig } from "./envs/local"
import { createSoloStagingConfig } from "./envs/soloStaging"

export function getContractsConfig() {
  switch (process.env.NEXT_PUBLIC_APP_ENV) {
    case "local":
      return createLocalConfig()
    case "solo-staging":
      return createSoloStagingConfig()
    case "testnet":
      throw "Testnet contracts config are not implemented yet"
    case "production":
      throw "Production contracts config are not implemented yet"

    default:
      throw new Error(`Invalid NEXT_PUBLIC_APP_ENV "${process.env.NEXT_PUBLIC_APP_ENV}"`)
  }
}
