import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeMultipleClausesCall, ThorClient } from "@vechain/vechain-kit"

import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { XAppStatus } from "@/types/appDetails"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { AppDetailServerData, AppMetadata } from "./types"

const x2EarnAppsAbi = X2EarnApps__factory.abi
const x2EarnAppsAddress = getConfig().x2EarnAppsContractAddress as `0x${string}`

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

/**
 * Determine endorsement status based on app state
 */
const determineEndorsementStatus = (
  isUnendorsed: boolean,
  isEligible: boolean,
  isBlacklisted: boolean,
  appExists: boolean,
  score: bigint,
  threshold: bigint,
): XAppStatus => {
  if (isBlacklisted) return XAppStatus.BLACKLISTED
  if (!appExists) return XAppStatus.LOOKING_FOR_ENDORSEMENT
  if (isUnendorsed) {
    return isEligible ? XAppStatus.UNENDORSED_AND_ELIGIBLE : XAppStatus.UNENDORSED_NOT_ELIGIBLE
  }
  if (score >= threshold) {
    return XAppStatus.ENDORSED_AND_ELIGIBLE
  }
  return XAppStatus.UNKNOWN
}

/**
 * Batch 1: Fetch all X2EarnApps contract data in one call
 * Calls:
 * - app(appId) - basic app info
 * - baseURI() - metadata base URI
 * - endorsementScoreThreshold() - endorsement threshold
 * - getScore(appId) - app endorsement score
 * - isAppUnendorsed(appId) - unendorsed status
 * - isBlacklisted(appId) - blacklist status
 * - appExists(appId) - existence check
 */
const fetchAppMetadataAndEndorsementBatch = async (thor: ThorClient, appId: string) => {
  const results = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "app",
        args: [appId as `0x${string}`],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "baseURI",
        args: [],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "endorsementScoreThreshold",
        args: [],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "getScore",
        args: [appId as `0x${string}`],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "isAppUnendorsed",
        args: [appId as `0x${string}`],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "isBlacklisted",
        args: [appId as `0x${string}`],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "appExists",
        args: [appId as `0x${string}`],
      } as const,
    ],
  })

  const [appDetail, baseUri, threshold, score, isUnendorsed, isBlacklisted, appExists] = results
  const { id, teamWalletAddress, name, metadataURI, createdAtTimestamp, appAvailableForAllocationVoting } = appDetail

  return {
    appInfo: {
      id,
      teamWalletAddress,
      name,
      metadataURI: `${baseUri}${metadataURI}`,
      createdAtTimestamp,
      appAvailableForAllocationVoting,
    },
    threshold,
    score,
    isUnendorsed,
    isBlacklisted,
    appExists,
  }
}

/**
 * Batch 2: Fetch current allocation round and check eligibility
 * Calls:
 * - currentRoundId() from XAllocationVoting
 * - isEligible(appId, roundId) from X2EarnApps
 */
const fetchEligibilityBatch = async (thor: ThorClient, appId: string) => {
  const results = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "currentRoundId",
        args: [],
      } as const,
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "isEligible",
        args: [appId as `0x${string}`, BigInt(0)], // placeholder, will be set after getting round ID
      } as const,
    ],
  })

  const [currentRoundIdResult] = results as [bigint, unknown]
  const currentRoundId = currentRoundIdResult

  // Make second call with actual round ID
  const [isEligible] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: x2EarnAppsAbi,
        address: x2EarnAppsAddress,
        functionName: "isEligible",
        args: [appId as `0x${string}`, currentRoundId],
      } as const,
    ],
  })

  return isEligible as boolean
}

/**
 * Fetch IPFS metadata (logo, banner, screenshots, etc.)
 */
const fetchAppMetadata = async (metadataUri: string): Promise<AppMetadata> => {
  try {
    const metadata = (await getIpfsMetadata(metadataUri)) as Record<string, any>
    return {
      logo: metadata?.logo as string | undefined,
      banner: metadata?.banner as string | undefined,
      description: metadata?.description as string | undefined,
      screenshots: (metadata?.screenshots as string[]) || [],
    }
  } catch {
    return {
      logo: undefined,
      banner: undefined,
      description: undefined,
      screenshots: [],
    }
  }
}

/**
 * Main server-side data fetching function
 * Combines all batches and returns complete app detail data
 */
export const getAppDetailServerData = async (appId: string): Promise<AppDetailServerData | null> => {
  try {
    const thor = await getNodeJsThorClient()

    // Batch 1: Metadata and endorsement data (7 contract calls)
    const batch1Result = await fetchAppMetadataAndEndorsementBatch(thor, appId)

    if (!batch1Result.appInfo || !batch1Result.appExists) {
      return null
    }

    // Parallel: Batch 2 (eligibility) and IPFS metadata fetch
    const [isEligible, metadata] = await Promise.all([
      fetchEligibilityBatch(thor, appId),
      fetchAppMetadata(batch1Result.appInfo.metadataURI),
    ])

    // Determine final endorsement status
    const endorsementStatus = determineEndorsementStatus(
      batch1Result.isUnendorsed,
      isEligible,
      batch1Result.isBlacklisted,
      batch1Result.appExists,
      batch1Result.score,
      batch1Result.threshold,
    )

    return {
      appInfo: batch1Result.appInfo,
      metadata,
      endorsementData: {
        score: batch1Result.score.toString(),
        threshold: batch1Result.threshold.toString(),
        isUnendorsed: batch1Result.isUnendorsed,
        isBlacklisted: batch1Result.isBlacklisted,
        isEligible,
        status: endorsementStatus,
      },
    }
  } catch (error) {
    console.error(`Error fetching app detail data for app ${appId}:`, error)
    return null
  }
}
