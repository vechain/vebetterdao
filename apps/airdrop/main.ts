import { loadEnvVariables } from "./utils/InputUtils"
import { airdrop } from "./airdrop"
import { logger } from "./utils/Logger"

export const start = async () => {
  try {
    // Read environment variables
    const env = await loadEnvVariables()

    await airdrop(env, env.config.nodeUrl, env.config.b3trContractAddress)
  } catch (e) {
    logger.error("The airdrop failed with the following error: ", e)
  }
}

start()
