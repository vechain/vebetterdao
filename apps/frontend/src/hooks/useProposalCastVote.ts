import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getHasSetDecisionQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useHasSetDecision"
import { getNavigatorDecisionEventsKey } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorDecisionEvents"
import { buildClause } from "@/utils/buildClause"

import { getHasVotedQueryKey } from "../api/contracts/governance/hooks/useHasVotedInProposals"
import { getIsProposalQuorumReachedQueryKey } from "../api/contracts/governance/hooks/useIsProposalQuorumReached"
import { getUserProposalsVoteEventsQueryKey } from "../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { getProposalVotesQueryKey } from "../api/indexer/proposals/useProposalVotes"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()

type ClausesProps = {
  proposalId: string
  vote: string
  comment: string
}
type Props = { proposalId: string; isNavigator?: boolean; onSuccess?: () => void }

export const useProposalCastVote = ({ proposalId, isNavigator = false, onSuccess }: Props) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(
    ({ proposalId, vote, comment = "" }: ClausesProps) => {
      const clauses = [
        buildClause({
          to: getConfig().b3trGovernorAddress,
          contractInterface: GovernorInterface,
          method: "castVoteWithReason",
          args: [proposalId, vote, comment],
          comment: "cast proposal vote",
        }),
      ]

      // Governor: 0=Against, 1=For, 2=Abstain -> Registry: 1=Against, 2=For, 3=Abstain
      if (isNavigator) {
        const decision = Number(vote) + 1
        clauses.push(
          buildClause({
            to: getConfig().navigatorRegistryContractAddress,
            contractInterface: NavigatorRegistryInterface,
            method: "setProposalDecision",
            args: [proposalId, decision],
            comment: "set navigator proposal decision",
          }),
        )
      }

      return clauses
    },
    [isNavigator],
  )

  const refetchQueryKeys = useMemo(() => {
    const keys = [
      getHasVotedQueryKey([proposalId], account?.address ?? undefined),
      getProposalVotesQueryKey(proposalId),
      getIsProposalQuorumReachedQueryKey(proposalId),
      getUserProposalsVoteEventsQueryKey(account?.address ?? undefined),
    ]
    if (isNavigator && account?.address) {
      keys.push(getHasSetDecisionQueryKey(account.address, proposalId))
      keys.push(getNavigatorDecisionEventsKey(account.address))
    }
    return keys
  }, [proposalId, account?.address, isNavigator])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
