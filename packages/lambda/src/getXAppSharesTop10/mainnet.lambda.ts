import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { clauseBuilder, FunctionFragment } from "@vechain/sdk-core"
import { HttpClient, ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { findBlacklistedApps, getCurrentRoundId, getData, getRoundXApps, getRoundXAppShares } from "../helpers"
import { buildResponse } from "../helpers/api/response"
import { StandardApiError, SuccessResponseType } from "../helpers/api.types"

const nodeURL = mainnetConfig.nodeUrl
const ipfsFetchingService = mainnetConfig.ipfsFetchingService.endsWith("/")
  ? mainnetConfig.ipfsFetchingService
  : mainnetConfig.ipfsFetchingService + "/"

/**
 * Retrieves the top 10 XApp shares for the previous round on mainnet.
 *
 * @param thor - The ThorClient instance used to interact with the blockchain.
 * @returns A promise that resolves to an array of the top 10 XApp shares with their metadata.
 * @throws An error if any contract call to X2EarnApps::app reverts.
 */
const getXAppSharesTop10 = async (thor: ThorClient) => {
  // Get current last round id, then infer the previous round id
  const currentRoundId = await getCurrentRoundId(thor, mainnetConfig.xAllocationVotingContractAddress)
  const lastRoundId = Number(currentRoundId) - 1
  console.log("Retrieve allocation shares data for round:", lastRoundId)

  // Get the round app ids
  const roundAppIds = await getRoundXApps(thor, lastRoundId.toString(), mainnetConfig)

  // Find blacklisted apps and get the round app shares in parallel
  const [blacklistedAppIds, roundAppShares] = await Promise.all([
    findBlacklistedApps(thor, roundAppIds, mainnetConfig.x2EarnAppsContractAddress),
    getRoundXAppShares(thor, lastRoundId, roundAppIds, mainnetConfig.xAllocationPoolContractAddress),
  ])

  // Filter out blacklisted apps, sort by percentage and get top 10
  const top10AppShares = roundAppShares
    .filter(app => !blacklistedAppIds.includes(app.appId))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)

  // Get app data only for top 10
  const clauses = top10AppShares.map(app =>
    clauseBuilder.functionInteraction(
      mainnetConfig.x2EarnAppsContractAddress,
      X2EarnApps.createInterface().getFunction("app") as FunctionFragment,
      [app.appId],
    ),
  )
  const res = await thor.transactions.simulateTransaction(clauses)

  const top10AppsData = await Promise.all(
    res.map(async (r, index) => {
      if (r.reverted) {
        throw new Error(
          `Error in contract call to X2EarnApps::app at ${mainnetConfig.x2EarnAppsContractAddress}. Clause ${index + 1} for appId ${top10AppShares[index].appId} reverted with reason ${r.vmError}`,
        )
      }

      const decoded = X2EarnApps.createInterface().decodeFunctionResult("app", r.data)
      const appMetadataURI = decoded[0][3]
      const appMetadata = await getData(ipfsFetchingService + appMetadataURI)

      return {
        appId: top10AppShares[index].appId,
        metadataURI: appMetadataURI,
        percentage: top10AppShares[index].percentage.toFixed(2),
        name: appMetadata.name,
        logo: appMetadata.logo,
      }
    }),
  )

  return top10AppsData
}

/**
 * AWS Lambda handler to get the top 10 X-App shares.
 * This function feeds the VeBetter DAO website and should not be changed without prior discussion.
 *
 * @param event - The incoming event from API Gateway.
 * @param context - The execution context of the Lambda function.
 * @returns The result of the HTTP response.
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)

  try {
    const thorClient = new ThorClient(new HttpClient(nodeURL), { isPollingEnabled: false })
    const top10AppsData = await getXAppSharesTop10(thorClient)
    console.log("Top 10 X-App shares:", top10AppsData)
    return buildResponse(SuccessResponseType.SUCCESS, top10AppsData)
  } catch (error) {
    console.error("Error getting top 10 X-App shares:", error)
    return buildResponse(StandardApiError.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
