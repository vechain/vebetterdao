import { confirmAirdrop, getUserInput } from "./src/input/InputUtils"
import { airdrop } from "./src/airdrop"
import { logger } from "./src/logging/Logger"

export const start = async () => {
  try {
    // Get user input
    const env = await getUserInput()

    // Simulate the airdrop
    const simRes = await airdrop(env, true)

    if (simRes.success) {
      logger.info("The airdrop simulation was successful")
    } else {
      logger.error("The airdrop simulation failed. Exiting...")
      return
    }

    ;(await confirmAirdrop(simRes)) ? await airdrop(env) : logger.info("Airdrop cancelled")
  } catch (e) {
    logger.error("The airdrop failed with the following error: ", e)
  }
}

start()
