import { airdrop } from "./src/airdrop"
import { loadEnvVariables } from "./src/input/EnvVariableUtils"
import { logger } from "./src/logging/Logger"

export const start = async () => {
  try {
    // Get user input
    const env = await loadEnvVariables()

    // Simulate the airdrop
    const simRes = await airdrop(env, true)

    if (simRes.success) {
      logger.info("The airdrop simulation was successful")
    } else {
      logger.error("The airdrop simulation failed. Exiting...")
      return
    }

    await airdrop(env)
  } catch (e) {
    logger.error("The airdrop failed with the following error: ", e)
  }
}

start()
