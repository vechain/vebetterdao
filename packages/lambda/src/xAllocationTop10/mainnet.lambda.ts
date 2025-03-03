import { HttpClient, ThorClient } from "@vechain/sdk-network"
import {
  XAllocationVoting__factory as XAllocationVoting,
  XAllocationPool__factory as XAllocationPool,
  X2EarnApps__factory as X2EarnApps,
} from "@repo/contracts"
import { AppConfig } from "@repo/config"
import mainnetConfig from "@repo/config/mainnet"
import { getRoundXApps } from "../helpers"
import { clauseBuilder, FunctionFragment } from "@vechain/sdk-core"

const nodeURL = mainnetConfig.nodeUrl
const ipfsFetchingService = mainnetConfig.ipfsFetchingService.endsWith("/")
  ? mainnetConfig.ipfsFetchingService
  : mainnetConfig.ipfsFetchingService + "/"

const getCurrentRoundId = async (thor: ThorClient, config: AppConfig) => {
  const res = await thor.contracts.executeContractCall(
    config.xAllocationVotingContractAddress,
    XAllocationVoting.createInterface().getFunction("currentRoundId"),
    [],
  )

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res[0]
}

const getRoundXAppShares = async (thor: ThorClient, roundId: Number, roundAppIds: string[]) => {
  // Prepare the clauses to get the shares for the xApps in the round
  const clauses = roundAppIds.map(appId =>
    clauseBuilder.functionInteraction(
      mainnetConfig.xAllocationPoolContractAddress,
      XAllocationPool.createInterface().getFunction("getAppShares") as FunctionFragment,
      [roundId, appId],
    ),
  )
  const res = await thor.transactions.simulateTransaction(clauses)

  // Transform the data to get the shares for the xApps in the round
  const shares = res.map((r, index) => {
    if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.vmError}`)

    const decoded = XAllocationPool.createInterface().decodeFunctionResult("getAppShares", r.data)
    const share = Number(decoded[0]) / 100
    const unallocatedShare = Number(decoded[1]) / 100

    return {
      appId: roundAppIds[index] as string,
      percentage: share + unallocatedShare,
    }
  })

  return shares
}

const findBlacklistedApps = async (thor: ThorClient, appIds: string[]) => {
  // Prepare the clauses to check if the xApps are blacklisted
  const clauses = appIds.map(appId =>
    clauseBuilder.functionInteraction(
      mainnetConfig.x2EarnAppsContractAddress,
      X2EarnApps.createInterface().getFunction("isBlacklisted") as FunctionFragment,
      [appId],
    ),
  )
  const res = await thor.transactions.simulateTransaction(clauses)

  // Identify the blacklisted apps
  const blacklistedAppIds: string[] = []
  res.forEach((r, index) => {
    if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.vmError}`)

    const decoded = X2EarnApps.createInterface().decodeFunctionResult("isBlacklisted", r.data)

    if (decoded[0]) blacklistedAppIds.push(appIds[index])
  })

  return blacklistedAppIds
}

const getDataFromIPFS = async (metadataURI: string) => {
  try {
    const response = await fetch(ipfsFetchingService + metadataURI)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status} - for URI: ${metadataURI}`)
    }

    return await response.json()
  } catch (error) {
    console.error(error)
  }
}

const getXAppSharesTop10 = async (thor: ThorClient) => {
  // Get current last round id, then infer the previous round id
  const currentRoundId = await getCurrentRoundId(thor, mainnetConfig)
  const lastRoundId = Number(currentRoundId) - 1

  // Get the round app ids
  const roundAppIds = await getRoundXApps(thor, lastRoundId.toString(), mainnetConfig)

  // Find blacklisted apps, then filter out blacklisted ones
  const blacklistedAppIds = await findBlacklistedApps(thor, roundAppIds)
  const roundAppIdsFiltered = roundAppIds.filter(appId => !blacklistedAppIds.includes(appId))

  // Get the round app shares, then sort by percentage (limit to 10)
  const roundAppShares = await getRoundXAppShares(thor, lastRoundId, roundAppIdsFiltered)
  const top10AppShares = roundAppShares.sort((a, b) => b.percentage - a.percentage).slice(0, 10)

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
      if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.vmError}`)

      const decoded = X2EarnApps.createInterface().decodeFunctionResult("app", r.data)
      const appMetadataURI = decoded[0][3]
      const appMetadata = await getDataFromIPFS(appMetadataURI)

      return {
        appId: top10AppShares[index].appId,
        metadataURI: appMetadataURI,
        percentage: top10AppShares[index].percentage.toFixed(2),
        name: appMetadata.name,
        logo: appMetadata.logo?.replace("ipfs://", ipfsFetchingService) || "",
      }
    }),
  )

  return top10AppsData
}

// call getXAppSharesTop10
const thorClient = new ThorClient(new HttpClient(nodeURL), { isPollingEnabled: false })

getXAppSharesTop10(thorClient).then(console.log).catch(console.error)
