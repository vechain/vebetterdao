import { loadEnvVariables } from "./utils/EnvUtils"
import { airdrop } from "./airdrop"
import { config } from "@repo/config"

export const start = async () => {
  // Read environment variables
  const env = loadEnvVariables()

  await airdrop(env, config.nodeUrl, config.b3trContractAddress)
}

start()
