import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { FunctionFragment } from "ethers"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import { addressUtils, clauseBuilder } from "@vechain/sdk-core"

import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import testnetConfig from "@repo/config/testnet"

import { getSecret } from "../../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../../helpers/api.types"
import { buildResponse } from "../../helpers/api/response"

const NODE_URL = "https://testnet.vechain.org/"

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  const client = new SecretsManagerClient({ region: "eu-west-1" })

  const privateKey = await getSecret(client, "creator_nft_minter_pk", "creator-nft-minter-pk")
  const walletAddress = addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex"))

  return { walletAddress, privateKey }
}

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
const resetSignalCounter = async (thor: ThorClient, bannedWallet: string, reason: string) => {
  const { privateKey, walletAddress } = await getCallerWalletInfo()

  const clause = clauseBuilder.functionInteraction(
    testnetConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("resetUserSignalsWithReason") as FunctionFragment,
    [bannedWallet, reason],
  )

  const gasResult = await thor.gas.estimateGas([clause], walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = await thor.transactions.signTransaction(txBody, privateKey)
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)

  try {
    const requestBody = event?.walletAddress

    if (!requestBody) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: `Invalid request body: ${JSON.stringify(event)}`,
      })
    }

    const walletToBeUnbanned = requestBody

    if (!isValid(walletToBeUnbanned)) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "Invalid wallet address",
      })
    }

    const thorClient = new ThorClient(new HttpClient(NODE_URL), { isPollingEnabled: false })

    // TODO: Check if a wallet has completed the KYC

    const reason = `From lambda: reseting user signal counter ${walletToBeUnbanned}`
    const { receipt, gasResult } = await resetSignalCounter(thorClient, walletToBeUnbanned, reason)

    if (!receipt) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    return buildResponse(SuccessResponseType.SUCCESS, { receipt })
  } catch (error) {
    console.error("Error resetting signal counter:", error)

    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
