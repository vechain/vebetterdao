import { loadEnvVariables } from "./input/InputUtils"
import { airdrop } from "./airdrop"
import { logger } from "./logging/Logger"

export const start = async () => {
  try {
    // Read environment variables
    const env = await loadEnvVariables()

    await airdrop(env)
  } catch (e) {
    logger.error("The airdrop failed with the following error: ", e)
  }
}

start()
