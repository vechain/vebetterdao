import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import { FunctionFragment } from "ethers"
import { addressUtils, clauseBuilder } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { getSecret } from "../helpers/secret"
import { X2EarnCreator__factory } from "@repo/contracts/typechain-types"
import testnetConfig from "@repo/config/testnet"
import { isValid } from "@repo/utils/AddressUtils"
import { buildResponse } from "../helpers/api/response"
import { StandardApiError, CustomApiError, SuccessResponseType } from "../helpers/api.types"

const nodeURL = "https://testnet.vechain.org/"

const client = new SecretsManagerClient({ region: "eu-west-1" })
const awsMinterPkSecretId = "mint_creator_nft_pk"
const awsMinterPkSecretName = "mint-creator-nft-pk"

const mintCreatorNFT = async (thor: ThorClient, creatorWalletAddress: string) => {
  const privateKey = await getSecret(client, awsMinterPkSecretId, awsMinterPkSecretName)
  const clause = clauseBuilder.functionInteraction(
    testnetConfig.x2EarnCreatorContractAddress,
    X2EarnCreator__factory.createInterface().getFunction("safeMint") as FunctionFragment,
    [creatorWalletAddress],
  )
  const gasResult = await thor.gas.estimateGas([clause], addressUtils.fromPrivateKey(Buffer.from(privateKey, "hex")))
  if (gasResult.reverted) {
    console.error("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Transaction reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }
  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = await thor.transactions.signTransaction(txBody, privateKey)
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)
  return { receipt, gasResult }
}

/**
 * AWS Lambda handler function that triggers on API Gateway events.
 * Initiates the minting of the creator NFT by interacting with the X2EarnCreator contract.
 *
 * @param {APIGatewayEvent} event - The incoming event from API Gateway.
 * @param {Context} context - The execution context of the Lambda function.
 * @returns {Promise<APIGatewayProxyResult>} - The result of the HTTP response.
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)

  try {
    const requestBody = event.body ? JSON.parse(event.body) : null

    if (!requestBody || !requestBody.creatorWalletAddress) {
      return buildResponse(StandardApiError.BAD_REQUEST)
    }

    const creatorWalletAddress = requestBody.creatorWalletAddress

    if (!isValid(creatorWalletAddress)) {
      return buildResponse(StandardApiError.BAD_REQUEST)
    }

    const thorClient = new ThorClient(new HttpClient(nodeURL), { isPollingEnabled: false })

    const { receipt, gasResult } = await mintCreatorNFT(thorClient, creatorWalletAddress)

    if (!receipt) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    console.log("Creator NFT minted successfully:", receipt)
    return buildResponse(SuccessResponseType.SUCCESS, { receipt })
  } catch (error) {
    console.error("Error minting creator NFT:", error)
    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
