import { logger } from "./utils/Logger"
import { buildTx, signAndSendTx } from "./utils/TxUtils"
import { addressUtils } from "@vechain/vechain-sdk-core"
import { HttpClient, ThorClient } from "@vechain/vechain-sdk-network"
import { Env } from "./model/env"
import { readInputFile } from "./utils/InputUtils"

export const airdrop = async (env: Env, nodeUrl: string, b3trContractAddress: string) => {
  logger.info("Starting airdrop...")

  const thorNetwork = new HttpClient(nodeUrl)
  const thorClient = new ThorClient(thorNetwork)

  try {
    const signer = addressUtils.fromPrivateKey(env.pk)

    logger.info(`Sending ${env.type} airdrop for ${signer}`)

    // Read input file
    const recipients = await readInputFile(env.recipientInputFilePath)

    // Group recipients into batches
    const batches = []
    for (let i = 0; i < recipients.length; i += env.batchSize) {
      batches.push(recipients.slice(i, i + env.batchSize))
    }

    // Send batches
    for (const batch of batches) {
      // Send airdrop
      const tx = await buildTx(thorClient, b3trContractAddress, env.type, batch, signer, env.gasPriceCoef)

      logger.info(`Sending tx with ${batch.length} clauses`)

      // Sign the transaction
      const receipt = await signAndSendTx(thorClient, tx, env.pk)

      if (receipt.reverted) throw Error("Transaction reverted")

      logger.info(`Tx was successful. TxId: ${receipt.meta.txID}`)
      logger.info(`The following drops were made: ${JSON.stringify(batch)}`)
    }

    logger.info("Airdrop completed!")
  } catch (e) {
    logger.error(e)
    throw e
  } finally {
    // Close the thor client
    thorClient.destroy()
  }
}
