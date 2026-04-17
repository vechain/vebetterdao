import { getConfig } from "@repo/config"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().challengesContractAddress
const abi = B3TRChallenges__factory.abi
const method = "getChallengeSelectedApps" as const

export const getChallengeSelectedAppsQueryKey = (challengeId: number) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [BigInt(challengeId)] })

/**
 * Fetches only the selected app IDs for a challenge — avoids the heavy useChallenge hook.
 * @param challengeId the on-chain challenge ID
 * @param enabled gate to skip the call (e.g. when allApps is true)
 */
export const useChallengeSelectedApps = (challengeId: number, enabled: boolean) =>
  useCallClause({
    abi,
    address,
    method,
    args: [BigInt(challengeId)],
    queryOptions: {
      enabled: enabled && challengeId > 0,
      select: data => [...(data[0] as readonly string[])],
    },
  })
