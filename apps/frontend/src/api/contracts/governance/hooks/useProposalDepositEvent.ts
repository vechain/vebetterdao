import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { ethers } from "ethers"
/**
 * Hook to get the proposal deposit event
 * @param proposalId  the proposal id to get the deposit event for
 * @returns the deposit event for the proposal
 */
export const useProposalDepositEvent = (proposalId: string) => {
  const { account } = useWallet()
  const events = useProposalsEvents()

  const proposalDeposits = useMemo(
    () => events.data?.deposits.filter(deposit => deposit.proposalId === proposalId) || [],
    [events.data?.deposits, proposalId],
  )

  const supportingUserCount = useMemo(
    () => [...new Set(proposalDeposits.map(deposit => deposit.depositor))].length,
    [proposalDeposits],
  )

  const proposalDepositThresholdBN = useMemo(
    () => BigInt(events.data?.created.find(event => event.proposalId === proposalId)?.depositThreshold || 0),
    [events, proposalId],
  )

  const communityDepositsBN = useMemo(() => {
    return proposalDeposits.reduce((acc, deposit) => acc + BigInt(deposit.amount), BigInt(0))
  }, [proposalDeposits])

  const missingSupport = useMemo(() => {
    return ethers.formatEther(proposalDepositThresholdBN - communityDepositsBN)
  }, [proposalDepositThresholdBN, communityDepositsBN])

  const communityDeposits = useMemo(() => {
    return Number(ethers.formatEther(communityDepositsBN))
  }, [communityDepositsBN])

  const userSupport = useMemo(() => {
    const deposits = proposalDeposits
      .filter(deposit => compareAddresses(deposit.depositor, account?.address || ""))
      .reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(ethers.formatEther(BigInt(deposits || 0)))
  }, [account, proposalDeposits])

  const othersDeposits = useMemo(
    () => proposalDeposits.filter(deposit => !compareAddresses(deposit.depositor, account?.address || "")),
    [account, proposalDeposits],
  )
  const othersSupport = useMemo(() => {
    const deposits = othersDeposits.reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(ethers.formatEther(BigInt(deposits || 0)))
  }, [othersDeposits])

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
    deposits: events.data?.deposits,
    isLoading: events.isLoading,
    error: events.error,
  }
}
