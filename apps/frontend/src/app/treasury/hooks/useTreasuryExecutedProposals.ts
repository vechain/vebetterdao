import { getConfig } from "@repo/config"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { Treasury__factory } from "@vechain/vebetterdao-contracts/factories/Treasury__factory"
import BigNumber from "bignumber.js"
import { formatEther } from "ethers"
import { useMemo } from "react"

import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { GrantProposalEnriched, ProposalState, ProposalType } from "@/hooks/proposals/grants/types"

const treasuryAddress = getConfig().treasuryContractAddress.toLowerCase()
const treasuryInterface = Treasury__factory.createInterface()

const TRANSFER_METHODS = ["transferB3TR", "transferVET", "transferVTHO", "transferVOT3", "transferTokens"] as const

type ExecutedProposal = {
  id: string
  title: string
  roundId: string
  date: string
  transferAmount: string
  transferToken: string
}

const decodeTransferAmount = (
  calldatas: readonly `0x${string}`[],
  targets: readonly string[],
): { amount: string; token: string } | null => {
  let totalAmount = new BigNumber(0)
  let token = "B3TR"

  for (let i = 0; i < calldatas.length; i++) {
    if (targets[i]?.toLowerCase() !== treasuryAddress) continue

    const calldata = calldatas[i]
    if (!calldata) continue

    for (const method of TRANSFER_METHODS) {
      try {
        const decoded = treasuryInterface.decodeFunctionData(method, calldata)
        const amount = new BigNumber(formatEther(decoded[1]?.toString() ?? "0"))
        totalAmount = totalAmount.plus(amount)
        if (method === "transferVET") token = "VET"
        else if (method === "transferVTHO") token = "VTHO"
        else if (method === "transferVOT3") token = "VOT3"
        else token = "B3TR"
        break
      } catch {
        // not this method, try next
      }
    }
  }

  if (!totalAmount.gt(0)) return null

  return { amount: humanNumber(totalAmount.toString()), token }
}

export const useTreasuryExecutedProposals = () => {
  const { data, isLoading } = useProposalEnriched()

  const executedProposals = useMemo((): ExecutedProposal[] => {
    if (!data?.enrichedProposals?.length) return []

    return data.enrichedProposals
      .filter(p => p.state === ProposalState.Executed || p.state === ProposalState.Completed)
      .map((proposal): ExecutedProposal | null => {
        const isGrant = proposal.type === ProposalType.Grant
        const grantAmount = isGrant ? (proposal as GrantProposalEnriched).grantAmountRequested : 0

        const date = new Date(proposal.createdAt * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        if (isGrant && grantAmount > 0) {
          return {
            id: proposal.id,
            title: (proposal as GrantProposalEnriched).title || proposal.title,
            roundId: proposal.votingRoundId,
            date,
            transferAmount: humanNumber(String(grantAmount)),
            transferToken: "B3TR",
          }
        }

        const decoded = decodeTransferAmount(proposal.calldatas, proposal.targets)
        if (!decoded) return null

        return {
          id: proposal.id,
          title: proposal.title,
          roundId: proposal.votingRoundId,
          date,
          transferAmount: decoded.amount,
          transferToken: decoded.token,
        }
      })
      .filter((p): p is ExecutedProposal => p !== null)
      .sort((a, b) => Number(b.roundId) - Number(a.roundId))
  }, [data?.enrichedProposals])

  return { executedProposals, isLoading }
}
