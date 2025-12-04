import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useMemo } from "react"

import { useProposalEnrichedById } from "@/hooks/proposals/common/useProposalEnrichedById"
import { getEventsKey, useEvents } from "@/hooks/useEvents"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress as `0x${string}`

export const getProposalDepositEventsQueryKey = (proposalId: string) =>
  getEventsKey({ eventName: "ProposalDeposit", filterParams: { proposalId: BigInt(proposalId) } })

/**
 * Hook to get the proposal deposit event
 * @param proposalId  the proposal id to get the deposit event for
 * @returns the deposit event for the proposal
 */
export const useProposalDepositEvent = (proposalId: string) => {
  const { account } = useWallet()
  const { data: proposal } = useProposalEnrichedById(proposalId)
  const {
    data: proposalDeposits = [],
    isLoading,
    error,
  } = useEvents({
    abi,
    contractAddress,
    eventName: "ProposalDeposit",
    filterParams: { proposalId: BigInt(proposalId) },
    select: events => events.map(({ decodedData }) => decodedData.args),
  })

  // Get the number of supports
  const supportingUserCount = useMemo(
    () => [...new Set(proposalDeposits.map(deposit => deposit.depositor))].length,
    [proposalDeposits],
  )
  // Get the deposit threshold
  const proposalDepositThresholdBN = useMemo(
    () => BigInt(proposal?.depositThreshold || 0),
    [proposal?.depositThreshold],
  )
  // Get the community deposits
  const communityDepositsBN = useMemo(() => {
    return proposalDeposits.reduce((acc, deposit) => acc + deposit.amount, 0n)
  }, [proposalDeposits])
  // How many missing support
  const missingSupport = useMemo(() => {
    return ethers.formatEther(proposalDepositThresholdBN - communityDepositsBN)
  }, [proposalDepositThresholdBN, communityDepositsBN])
  // Get the community deposits
  const communityDeposits = useMemo(() => {
    return Number(ethers.formatEther(communityDepositsBN))
  }, [communityDepositsBN])

  // Get the user support
  const userSupport = useMemo(() => {
    const deposits = proposalDeposits
      .filter(deposit => compareAddresses(deposit.depositor, account?.address || ""))
      .reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(ethers.formatEther(BigInt(deposits || 0)))
  }, [account, proposalDeposits])

  // Get the others deposits
  const othersDeposits = useMemo(
    () => proposalDeposits.filter(deposit => !compareAddresses(deposit.depositor, account?.address || "")),
    [account, proposalDeposits],
  )

  // Get the others support
  const othersSupport = useMemo(() => {
    const deposits = othersDeposits.reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(ethers.formatEther(BigInt(deposits || 0)))
  }, [othersDeposits])

  // Get the others support user count
  const othersSupportUserCount = useMemo(() => {
    return [...new Set(othersDeposits.map(deposit => deposit.depositor))].length
  }, [othersDeposits])

  const hasUserSupported = Number(userSupport) > 0

  return {
    supportingUserCount,
    communityDeposits,
    missingSupport,
    userSupport,
    othersSupport,
    othersSupportUserCount,
    hasUserSupported,
    deposits: proposalDeposits,
    isLoading,
    error,
  }
}
