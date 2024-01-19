import { logger } from "./logging/Logger"
import { buildTx, signAndSendTx } from "./transaction/TxUtils"
import { addressUtils } from "@vechain/vechain-sdk-core"
import { HttpClient, ThorClient } from "@vechain/vechain-sdk-network"
import { Env } from "../env"
import { readInputFile } from "./input/FileReader"

export type AirdropResponse = {
  success: boolean
  numRecipients: number
  totalAmount: bigint
}

export const airdrop = async (env: Env, simulate = false): Promise<AirdropResponse> => {
  logger.info(`${simulate ? "Simulating" : "Starting"} airdrop...`)

  const response = {
    success: true,
    numRecipients: 0,
    totalAmount: BigInt(0),
  }

  const thorNetwork = new HttpClient(env.nodeUrl)
  const thorClient = new ThorClient(thorNetwork)

  try {
    const signer = addressUtils.fromPrivateKey(env.pk)

    logger.info(`${env.type} airdrop for ${signer} on ${env.networkType} network`)

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
      const tx = await buildTx(thorClient, env.b3trContractAddress, env.type, batch, signer, env.gasPriceCoef)

      if (!simulate) {
        logger.info(`Sending tx with ${batch.length} clauses`)

        // Sign the transaction
        const receipt = await signAndSendTx(thorClient, tx, env.pk)

        if (receipt.reverted) throw Error("Transaction reverted")

        logger.info(`Tx was successful. TxId: ${receipt.meta.txID}`)
        logger.info(`The following drops were made: ${JSON.stringify(batch)}`)
      }

      // Update response
      response.numRecipients += batch.length
      response.totalAmount += batch.reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
    }

    if (!simulate) logger.info("Airdrop completed!")
  } catch (e) {
    response.success = false
  } finally {
    // Close the thor client
    thorClient.destroy()
  }

  return response
}
