import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

export type InfractionType =
  | "missedAllocationVote"
  | "missedGovernanceVote"
  | "stalePreferences"
  | "missedReport"
  | "latePreferences"

export type ReportableInfraction = {
  type: InfractionType
  roundId: string
  voteEnd?: number
  proposalId?: string
  proposalTitle?: string
}

type ReportParams = {
  infraction: ReportableInfraction
  navigator: string
}

const INFRACTION_COMMENTS: Record<InfractionType, string> = {
  missedAllocationVote: "Report missed allocation vote",
  missedGovernanceVote: "Report missed governance vote",
  stalePreferences: "Report stale preferences",
  missedReport: "Report missed report",
  latePreferences: "Report late preferences",
}

type Props = {
  onSuccess?: () => void
}

export const useReportNavigatorInfraction = ({ onSuccess }: Props) => {
  const clauseBuilder = useCallback(({ infraction, navigator }: ReportParams) => {
    const { type, roundId, voteEnd, proposalId } = infraction

    const methodMap: Record<InfractionType, { method: string; args: unknown[] }> = {
      missedAllocationVote: {
        method: "reportMissedAllocationVote",
        args: [navigator, BigInt(roundId)],
      },
      missedGovernanceVote: {
        method: "reportMissedGovernanceVote",
        args: [navigator, BigInt(proposalId ?? 0)],
      },
      stalePreferences: {
        method: "reportStalePreferences",
        args: [navigator, BigInt(roundId)],
      },
      missedReport: {
        method: "reportMissedReport",
        args: [navigator, BigInt(roundId)],
      },
      latePreferences: {
        method: "reportLatePreferences",
        args: [navigator, BigInt(roundId), BigInt(voteEnd ?? 0)],
      },
    }

    const { method, args } = methodMap[type]

    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: method as any,
        args,
        comment: INFRACTION_COMMENTS[type],
      }),
    ]
  }, [])

  const refetchQueryKeys = useMemo(() => [], [])

  return useBuildTransaction<ReportParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
