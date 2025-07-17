import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { MAINNET_URL, TESTNET_URL, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import testnetStagingConfig from "@repo/config/testnet-staging"
import { AppEnv } from "@repo/config/contracts"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { buildClaimClause, getAllApps } from "../helpers/xApps"
import { getIdsOfUnclaimed } from "../helpers/xApps"
import { getSecret } from "../helpers/secret"
import { waitForRoundStart } from "../helpers/emissions"
import { publishMessage } from "../helpers/slack"
import { Emissions__factory } from "@repo/contracts"
import { buildTxBody, buildGasEstimate } from "../helpers"

interface NetworkConfig {
  nodeUrl: string
  config: typeof mainnetConfig
}

interface SecretsConfig {
  secretId: string
  privateKeyKey: string
}

interface SlackConfig {
  channelId: string
  messagePrefix: string
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
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        secretId: "start_emissions_pk",
        privateKeyKey: "start-emissions-pk",
      }
  }
}

const getSlackConfig = (): SlackConfig => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const environment = process.env.LAMBDA_ENV

  // C06BLEJE5SA - b3tr-dev (slack channel)
  // We are pointing this channel for both testnet and mainnet
  switch (environment) {
    case AppEnv.MAINNET:
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "",
      }

    case AppEnv.TESTNET_STAGING:
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "[STAGING] ",
      }

    default:
      // Fallback to testnet for any other environment
      return {
        channelId: "C06BLEJE5SA",
        messagePrefix: "[STAGING] ",
      }
  }
}

const { nodeUrl: NODE_URL, config: CONFIG } = getNetworkConfig()
const { secretId: SECRET_ID, privateKeyKey: PRIVATE_KEY_KEY } = getSecretsConfig()
const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

const client = new SecretsManagerClient({
  region: "eu-west-1",
})

/**
 * Distributes the VeBetterDAO emissions and starts the next round.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of emissions if successful and the gas result
 */
async function distributeEmissions(thor: ThorClient) {
  const privateKey = Buffer.from(await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY), "hex")
  const signerAddress = Address.ofPrivateKey(privateKey).toString()

  // Wait for the next round to start before proceeding
  await waitForRoundStart(thor, CONFIG)

  // Prepare the contract function call with necessary parameters
  const clause = Clause.callFunction(
    Address.of(CONFIG.emissionsContractAddress),
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("distribute"),
    [],
  )

  // Estimate the gas cost for the transaction
  let gasResult = await buildGasEstimate(thor, [clause], signerAddress)

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Round failed to start: ${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
  }

  // Build the transaction body with the estimated gas
  let txBody = await buildTxBody(thor, [clause], gasResult.totalGas * 2)

  // Sign the transaction with the developer's private key
  let signedTx = Transaction.of(txBody).sign(privateKey)

  // Send the signed transaction to the blockchain
  let tx = await thor.transactions.sendTransaction(signedTx)

  // Wait for the transaction to be processed and get the receipt
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}

/**
 * Distributes X-Allocations to the X-App addresses that have not yet claimed their allocations.
 *
 * @param thor - The ThorClient instance
 * @returns the transaction receipt of the distribution of X-Allocations if successful and the gas result
 */
async function distributeXAllocations(thor: ThorClient) {
  const privateKey = await getSecret(client, SECRET_ID, PRIVATE_KEY_KEY)

  if (!privateKey) {
    throw new Error("Private key not found")
  }

  // Get the current round number from the Emissions contract
  const currentRound = await thor.contracts.executeCall(
    CONFIG.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
    [],
  )
  // Get the previous round number for which the X-Allocations are to be distributed
  const previousRound = Number(currentRound.result?.array?.[0] ?? 0) - 1

  // Get the X-Apps for the current round
  const xApps = await getAllApps(thor, CONFIG, previousRound.toString())

  // Get the IDs of the X-Apps that have not yet claimed their allocations
  const xAppIds = await getIdsOfUnclaimed(thor, CONFIG, xApps, previousRound.toString())

  const claimClauses = []

  // Build the claim clauses for the X-Apps that have not yet claimed their allocations and the gas estimation does not revert
  for (const xAppId of xAppIds) {
    const claimClause = buildClaimClause(CONFIG, xAppId, previousRound.toString())

    // Estimate the gas cost for the transaction
    const gasResult = await thor.gas.estimateGas(
      [claimClause],
      Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
    )

    // Check if the transaction was estimated to revert and handle accordingly
    if (!gasResult.reverted) {
      claimClauses.push(claimClause)
    }
  }

  // Estimate the gas cost for the transaction
  const gasResult = await buildGasEstimate(
    thor,
    claimClauses,
    Address.ofPrivateKey(Buffer.from(privateKey, "hex")).toString(),
  )

  // Check if the transaction was estimated to revert and handle accordingly
  if (gasResult.reverted) {
    console.log("Transaction reverted:", gasResult.revertReasons, gasResult.vmErrors)

    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Failed to distribute X-Allocations:\n${gasResult.revertReasons}, ${gasResult.vmErrors}`,
    )

    return { receipt: null, gasResult }
  }

  // Build the transaction body with the estimated gas
  const txBody = await buildTxBody(thor, claimClauses, gasResult.totalGas * 2)

  // Sign the transaction with the developer's private key
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))

  // Send the signed transaction to the blockchain
  const tx = await thor.transactions.sendTransaction(signedTx)

  const receipt = await thor.transactions.waitForTransaction(tx.id)

  // Return the transaction receipt
  return { receipt, gasResult }
}

/**
 * AWS Lambda handler function that triggers on API Gateway events. It initiates the distribution
 * process of emissions by interacting with the Emissions contract.
 *
 * @param {APIGatewayEvent} event - The incoming event from API Gateway.
 * @param {Context} context - The execution context of the Lambda function.
 * @returns {Promise<APIGatewayProxyResult>} - The result of the HTTP response.
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log event and context for debugging and tracking
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)
  console.log(`Network: ${NODE_URL}`)

  try {
    // Initialize the Thor client with the environment-specific URL and disable polling
    const thorClient = ThorClient.at(NODE_URL, {
      isPollingEnabled: false,
    })

    // Distribute the emissions to the VeBetterDAO and start the next round
    const { receipt: receiptEmissions, gasResult: gasResultEmissions } = await distributeEmissions(thorClient)

    if (!receiptEmissions)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultEmissions.revertReasons}, ${gasResultEmissions.vmErrors}`,
        }),
      }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptEmissions)

    // Publish a success message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: Round started successfully`,
    )

    // Distribute the X-Allocations to the X-App addresses that have not yet claimed them
    const { receipt: receiptClaim, gasResult: gasResultXallocations } = await distributeXAllocations(thorClient)

    if (!receiptClaim)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Transaction reverted: ${gasResultXallocations.revertReasons}, ${gasResultXallocations.vmErrors}`,
        }),
      }

    // Log the transaction receipt for debugging and verification
    console.log("Receipt:", receiptClaim)

    // Publish a success message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:white_check_mark: X-Allocations distributed successfully`,
    )

    // Return a successful response with the transaction receipt
    return {
      statusCode: 200,
      body: JSON.stringify({
        receiptEmissions,
        receiptClaim,
      }),
    }
  } catch (error) {
    // Log and return errors if the process fails at any point
    console.log("Error starting the round:", error)

    // Publish an error message to the Slack channel
    await publishMessage(
      client,
      SLACK_CHANNEL_ID,
      `${SLACK_MESSAGE_PREFIX}:alert: Error starting round or distributing allocations: ${error}`,
    )

    return {
      statusCode: 500,
      body: JSON.stringify({
        error,
      }),
    }
  }
}
