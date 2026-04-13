import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { getHasSetPreferencesQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useHasSetPreferences"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getParticipatedInGovernanceQueryKey } from "../api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { getXAppRoundEarningsQueryKey } from "../api/contracts/xAllocationPool/hooks/useXAppRoundEarnings"
import { getAllocationVotersQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationVoters"
import { getAllocationVotesQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationVotes"
import { getHasVotedInRoundQueryKey } from "../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { getUserVotesInRoundQueryKey } from "../api/contracts/xApps/hooks/useUserVotesInRound"
import { getXAppsSharesQueryKey } from "../api/contracts/xApps/hooks/useXAppShares"

import { useBuildTransaction } from "./useBuildTransaction"

//Extra 15% to mitigate low gas estimation when voting on a large number of apps
//Check https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1752523695772269
const GAS_PADDING = 0.15
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const BASIS_POINTS = 10000n

/**
 * CastAllocationVotesProps is the type of the data to send to the castAllocationVotes hook
 * appId is the id of the app to vote
 * votes is the vote weight in ether (will be converted to wei via parseEther)
 * accepts number or string for precision (string is recommended)
 */
export type CastAllocationVotesProps = {
  appId: string
  votes: number | string
}[]

type useCastAllocationVotesProps = {
  roundId: string
  isNavigator?: boolean
  onSuccess?: () => void
  onSuccessMessageTitle?: string
  transactionModalCustomUI?: TransactionCustomUI
}
const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()
/**
 * Hook to cast votes to one or more apps in a round
 * This hook will send a vote transaction to the blockchain and wait for the txConfirmation
 * @param roundId the id of the round to cast the votes
 * @param onSuccess callback to run when the upgrade is successful
 * @param transactionModalCustomUI custom UI for the transaction modal
 */
export const useCastAllocationVotes = ({
  roundId,
  isNavigator = false,
  onSuccess,
  transactionModalCustomUI,
}: useCastAllocationVotesProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback(
    (data: CastAllocationVotesProps) => {
      const filteredData = data.filter(value => {
        const numVotes = typeof value.votes === "string" ? parseFloat(value.votes) : value.votes
        return numVotes > 0
      })

      const apps = filteredData.map(value => value.appId)
      const votes = filteredData.map(value => ethers.parseEther(value.votes.toString()))

      const clauses: EnhancedClause[] = [
        {
          to: getConfig().xAllocationVotingContractAddress,
          value: 0,
          data: XAllocationVotingInterface.encodeFunctionData("castVote", [roundId, apps, votes]),
          comment: `Cast your vote on round ${roundId}`,
          abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("castVote"))),
        },
      ]

      if (isNavigator) {
        const totalVotes = votes.reduce((sum, v) => sum + v, 0n)
        const percentages =
          totalVotes > 0n
            ? votes.map((v, i) => {
                if (i === votes.length - 1) {
                  const sumSoFar = votes.slice(0, -1).reduce((s, w) => s + (w * BASIS_POINTS) / totalVotes, 0n)
                  return BASIS_POINTS - sumSoFar
                }
                return (v * BASIS_POINTS) / totalVotes
              })
            : votes.map(() => BASIS_POINTS / BigInt(votes.length))

        clauses.push({
          to: getConfig().navigatorRegistryContractAddress,
          value: 0,
          data: NavigatorRegistryInterface.encodeFunctionData("setAllocationPreferences", [roundId, apps, percentages]),
          comment: `Set navigator allocation preferences for round ${roundId}`,
          abi: JSON.parse(JSON.stringify(NavigatorRegistryInterface.getFunction("setAllocationPreferences"))),
        })
      }

      return clauses
    },
    [roundId, isNavigator],
  )

  const refetchQueryKeys = useMemo(() => {
    const keys = [
      getAllocationVotesQueryKey(roundId),
      getAllocationVotersQueryKey(roundId),
      getXAppsSharesQueryKey(roundId),
      getUserVotesInRoundQueryKey(roundId, account?.address ?? ""),
      getHasVotedInRoundQueryKey(roundId, account?.address ?? undefined),
      getXAppRoundEarningsQueryKey(roundId),
      getParticipatedInGovernanceQueryKey(account?.address ?? ""),
    ]
    if (isNavigator && account?.address) {
      keys.push(getHasSetPreferencesQueryKey(account.address, roundId))
    }
    return keys
  }, [roundId, account?.address, isNavigator])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    // @ts-ignore
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
    gasPadding: GAS_PADDING,
  })
}
