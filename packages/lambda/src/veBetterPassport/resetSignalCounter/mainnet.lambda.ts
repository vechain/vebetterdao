import { APIGatewayProxyResult, Context } from "aws-lambda"
import { FunctionFragment } from "ethers"

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import { addressUtils, clauseBuilder } from "@vechain/sdk-core"

import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

import mainnetConfig from "@repo/config/mainnet"
import { getSecret } from "../../helpers/secret"
import { CustomApiError, StandardApiError, SuccessResponseType } from "../../helpers/api.types"
import { buildResponse } from "../../helpers/api/response"

const NODE_URL = "https://mainnet.vechain.org/"
const VET_DOMAINS_CONTRACT_ADDRESS = "0xbd7832FdacCB89FAB522e5B4Afb415A999b8a201"
const VET_DOMAINS_CONTRACT_ABI_FRAGMENT = JSON.stringify({
  inputs: [
    {
      internalType: "address",
      name: "user",
      type: "address",
    },
  ],
  name: "isVerified",
  outputs: [
    {
      internalType: "bool",
      name: "",
      type: "bool",
    },
  ],
  stateMutability: "view",
  type: "function",
})

/**
 * Retrieves the caller wallet information.
 * @returns An object containing the wallet address and private key.
 */
const getCallerWalletInfo = async (): Promise<{ walletAddress: string; privateKey: string }> => {
  const client = new SecretsManagerClient({ region: "eu-west-1" })

  const privateKey = await getSecret(client, "vebetterpassport_reset_signal_mainnet", "RESET_SIGNALER_PK")
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
    mainnetConfig.veBetterPassportContractAddress,
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

/**
 *
 * Retrieves the verified vet domain for a given wallet address.
 * @param thor - The ThorClient instance.
 * @param walletAddress - The wallet address to check.
 * @returns A boolean indicating if the wallet has a verified vet domain.
 */
export const getVerifiedVetDomain = async (thor: ThorClient, walletAddress?: string): Promise<boolean> => {
  const res = await thor.contracts.executeContractCall(
    VET_DOMAINS_CONTRACT_ADDRESS,
    JSON.parse(VET_DOMAINS_CONTRACT_ABI_FRAGMENT),
    [walletAddress],
  )

  if (res.vmError) {
    return Promise.reject(new Error(res.vmError))
  }

  return res[0]
}

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  console.log(`Caller wallet address: ${(await getCallerWalletInfo()).walletAddress}`)
  console.log(`Interacting with contract: ${mainnetConfig.veBetterPassportContractAddress} on network: ${NODE_URL}`)

  try {
    const requestBody = event?.walletAddress

    if (!requestBody) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: `Invalid request body - walletAddress is required: ${JSON.stringify(event)}`,
      })
    }

    const walletToBeUnbanned = requestBody

    if (!isValid(walletToBeUnbanned)) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "Invalid wallet address format",
      })
    }

    const thorClient = new ThorClient(new HttpClient(NODE_URL), { isPollingEnabled: false })

    // Check if a wallet has completed the KYC from VetDomains contract
    const isVerified = await getVerifiedVetDomain(thorClient, walletToBeUnbanned)
    if (!isVerified) {
      return buildResponse(StandardApiError.BAD_REQUEST, {
        message: "Wallet status is either pending or not verified.",
      })
    }

    const reason = `Resetting signal counter for KYC'ed wallet`
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
