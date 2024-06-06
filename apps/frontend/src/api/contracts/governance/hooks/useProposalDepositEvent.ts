import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useScaleVot3Amount } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"

export const useProposalDepositEvent = (proposalId: string) => {
  const scaleVot3Amount = useScaleVot3Amount()
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
  const communityDeposits = useMemo(() => {
    const deposits = proposalDeposits.reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(scaleVot3Amount(deposits))
  }, [proposalDeposits, scaleVot3Amount])

  const userSupport = useMemo(() => {
    const deposits = proposalDeposits
      .filter(deposit => compareAddresses(deposit.depositor, account || ""))
      .reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(scaleVot3Amount(deposits))
  }, [account, proposalDeposits, scaleVot3Amount])

  const othersDeposits = useMemo(
    () => proposalDeposits.filter(deposit => !compareAddresses(deposit.depositor, account || "")),
    [account, proposalDeposits],
  )
  const othersSupport = useMemo(() => {
    const deposits = othersDeposits.reduce((acc, deposit) => acc + Number(deposit.amount), 0)
    return Number(scaleVot3Amount(deposits))
  }, [othersDeposits, scaleVot3Amount])

  const othersSupportUserCount = useMemo(() => {
    return [...new Set(othersDeposits.map(deposit => deposit.depositor))].length
  }, [othersDeposits])

  const hasUserSupported = Number(userSupport) > 0

  return {
    supportingUserCount,
    communityDeposits,
    userSupport,
    othersSupport,
    othersSupportUserCount,
    hasUserSupported,
    deposits: events.data?.deposits,
    isLoading: events.isLoading,
    error: events.error,
  }
}
