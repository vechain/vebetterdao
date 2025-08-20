import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { getSecret } from "../helpers/secret"
import { X2EarnCreator__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { isValid } from "@repo/utils/AddressUtils"
import { buildResponse } from "../helpers/api/response"
import { StandardApiError, CustomApiError, SuccessResponseType } from "../helpers/api.types"
import { buildGasEstimate, buildTxBody } from "../helpers"

interface NetworkConfig {
  nodeUrl: string
  config: typeof mainnetConfig
}

interface SecretsConfig {
  secretId: string
  secretName: string
}

const getNetworkConfig = (): NetworkConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        nodeUrl: MAINNET_URL,
        config: mainnetConfig,
      }

    case AppEnv.TESTNET_STAGING:
      return {
        nodeUrl: TESTNET_URL,
        config: testnetStagingConfig,
      }

    default:
      // Fallback to testnet for any other environment
      return {
        nodeUrl: TESTNET_URL,
        config: testnetStagingConfig,
      }
  }
}

const getSecretsConfig = (): SecretsConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  switch (environment) {
    case AppEnv.MAINNET:
      return {
        secretId: "mint_creator_nft_pk",
        secretName: "mint-creator-nft-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "creator_nft_minter_pk",
        secretName: "creator-nft-minter-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "creator_nft_minter_pk",
        secretName: "creator-nft-minter-pk",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: AWS_MINTER_PK_SECRET_ID, secretName: AWS_MINTER_PK_SECRET_NAME } = getSecretsConfig()

const client = new SecretsManagerClient({ region: "eu-west-1" })

const mintCreatorNFT = async (thor: ThorClient, creatorWalletAddress: string) => {
  const privateKey = await getSecret(client, AWS_MINTER_PK_SECRET_ID, AWS_MINTER_PK_SECRET_NAME)

  if (!privateKey) {
    throw new Error("Private key not found")
  }

  const clause = Clause.callFunction(
    Address.of(CONFIG.x2EarnCreatorContractAddress),
    ABIContract.ofAbi(X2EarnCreator__factory.abi).getFunction("safeMint"),
    [creatorWalletAddress],
  )

  const gasResult = await buildGasEstimate(
    thor,
    [clause],
    Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
  )
  if (gasResult.reverted) {
    throw new Error(`Transaction reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }
  const txBody = await buildTxBody(thor, [clause], gasResult.totalGas)

  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))

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
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)

  try {
    const requestBody = event.body ? JSON.parse(event.body) : null

    if (!requestBody || !requestBody.creatorWalletAddress) {
      return buildResponse(StandardApiError.BAD_REQUEST)
    }

    const creatorWalletAddress = requestBody.creatorWalletAddress

    if (!isValid(creatorWalletAddress)) {
      return buildResponse(StandardApiError.BAD_REQUEST)
    }

    const thorClient = ThorClient.at(NODE_URL, { isPollingEnabled: false })

    const { receipt, gasResult } = await mintCreatorNFT(thorClient, creatorWalletAddress)

    if (!receipt) {
      return buildResponse(CustomApiError.TRANSACTION_REVERTED, {
        revertReasons: gasResult?.revertReasons,
        vmErrors: gasResult?.vmErrors,
      })
    }

    console.log("Creator NFT minted successfully:", { receipt, freshdeskTicketId: requestBody?.ticketId })
    return buildResponse(SuccessResponseType.SUCCESS, { receipt })
  } catch (error) {
    console.error("Error minting creator NFT:", error)
    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
