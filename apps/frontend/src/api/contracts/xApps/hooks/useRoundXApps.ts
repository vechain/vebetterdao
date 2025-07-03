import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"
import { AllApps, isNewApp } from "../getXApps"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const method = "getAppsOfRound" as const

export const getRoundXAppsQueryKey = (roundId?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(roundId ?? 0)],
  })

export const useRoundXApps = (roundId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId ?? 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data =>
        data[0].map(app => ({
          id: app.id.toString(),
          teamWalletAddress: app.teamWalletAddress,
          name: app.name,
          metadataURI: app.metadataURI,
          createdAtTimestamp: app.createdAtTimestamp.toString(),
          appAvailableForAllocationVoting: app.appAvailableForAllocationVoting ?? false,
          isNew: isNewApp({ ...app, createdAtTimestamp: app.createdAtTimestamp.toString() }),
        })) as AllApps[],
    },
  })
}
