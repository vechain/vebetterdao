import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { useWallet, currentBlockQueryKey } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalClaimableUserDepositsQueryKey } from "../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { getHasXAppClaimedQueryKey } from "../api/contracts/xAllocationPool/hooks/useHasXAppClaimed"
import { useHaveXAppsClaimed } from "../api/contracts/xAllocationPool/hooks/useHaveXAppsClaimed"
import { getAllocationAmountQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationAmount"
import { getAllocationsRoundsEventsQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { getAllocationsRoundStateQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { getCurrentAllocationsRoundDeadlineQueryKey } from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import {
  getCurrentAllocationsRoundIdQueryKey,
  useCurrentAllocationsRoundId,
} from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { getCurrentRoundSnapshotQueryKey } from "../api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { getRoundXAppsQueryKey, useRoundXApps } from "../api/contracts/xApps/hooks/useRoundXApps"

import { useBuildTransaction } from "./useBuildTransaction"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"
import { getRoundsDatesQueryKey } from "./useGetRoundsDates"

const EmissionsInterface = Emissions__factory.createInterface()
const XAllocationPoolInterface = XAllocationPool__factory.createInterface()
interface UseStartRoundAndClaimWorkflowProps {
  roundId: string
  onSuccess?: () => void
}
export const useStartRoundAndClaimWorkflow = ({ roundId, onSuccess }: UseStartRoundAndClaimWorkflowProps) => {
  const { account } = useWallet()
  const config = getConfig()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: xApps } = useRoundXApps(currentRoundId?.toString() ?? "")
  // Get apps that haven't claimed yet
  const { data: claims } = useHaveXAppsClaimed(currentRoundId?.toString() ?? "", xApps?.map(app => app.id) ?? [])
  const xAppsLeft = useMemo(() => {
    return xApps?.filter(app => !claims?.find(claim => claim?.appId === app.id)?.claimed) ?? []
  }, [xApps, claims])
  const clauseBuilder = useCallback(() => {
    if (!account?.address) throw new Error("Account is required")
    const clauses = []
    // First clause: Distribute emissions
    clauses.push(
      buildClause({
        to: config.emissionsContractAddress,
        contractInterface: EmissionsInterface,
        method: "distribute",
        args: [],
        comment: `Distribute emissions for round ${roundId}`,
      }),
    )

    // Additional clauses: Claim allocations for each app ID
    xAppsLeft.forEach(app => {
      clauses.push(
        buildClause({
          to: config.xAllocationPoolContractAddress,
          contractInterface: XAllocationPoolInterface,
          method: "claim",
          args: [roundId, app.id],
          comment: `Claiming allocation for ${app.name} (Round ${roundId})`,
        }),
      )
    })

    return clauses
  }, [account?.address, roundId, xAppsLeft, config])

  const refetchQueryKeys = useMemo(() => {
    const baseQueryKeys = [
      getCurrentAllocationsRoundIdQueryKey(),
      getAllocationsRoundsEventsQueryKey(),
      getCurrentAllocationsRoundDeadlineQueryKey(),
      getCurrentRoundSnapshotQueryKey(),
      getAllocationsRoundStateQueryKey(Number(roundId)),
      getRoundsDatesQueryKey(),
      currentBlockQueryKey(),
      getRoundXAppsQueryKey(currentRoundId ?? "0"),
      getAllocationAmountQueryKey(currentRoundId ?? "0"),
      getAllProposalsStateQueryKey(),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
    ]

    const hasAppClaimedQueryKeys = xAppsLeft.map(appId => getHasXAppClaimedQueryKey(roundId, appId.id))
    const b3TrBalanceQueryKeys = [
      getB3trBalanceQueryKey(account?.address ?? ""),
      getB3trBalanceQueryKey(config.x2EarnRewardsPoolContractAddress),
    ]

    return [...baseQueryKeys, ...hasAppClaimedQueryKeys, ...b3TrBalanceQueryKeys]
  }, [account?.address, currentRoundId, roundId, xAppsLeft, config])

  return {
    ...useBuildTransaction({
      clauseBuilder,
      refetchQueryKeys,
      onSuccess,
    }),
    xAppsLeftCount: xAppsLeft?.length ?? 0,
  }
}
