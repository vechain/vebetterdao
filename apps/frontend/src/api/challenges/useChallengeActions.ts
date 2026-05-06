import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/factories/B3TR__factory"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { getB3trBalanceQueryKey } from "@/hooks/useGetB3trBalance"
import { buildClause } from "@/utils/buildClause"

import { ChallengeKind, ChallengeView } from "./types"
import {
  challengePayoutClaimedEventName,
  challengeRefundClaimedEventName,
  splitWinCreatorRefundedEventName,
  splitWinPrizeClaimedEventName,
} from "./useChallengeClaimState"

const ChallengesInterface = B3TRChallenges__factory.createInterface()
const B3TRInterface = B3TR__factory.createInterface()

export interface CreateChallengeFormData {
  kind: number
  visibility: number
  challengeType: number
  stakeAmount: string
  startRound: number
  endRound: number
  threshold: string
  numWinners: string
  appIds: string[]
  invitees: string[]
  title: string
  description: string
  imageURI: string
  metadataURI: string
}

type ActionParams =
  | { type: "join"; challenge: ChallengeView }
  | { type: "leave"; challenge: ChallengeView }
  | { type: "decline"; challengeId: number }
  | { type: "cancel"; challengeId: number }
  | { type: "addInvites"; challengeId: number; invitees: string[] }
  | { type: "claimPayout"; challengeId: number }
  | { type: "claimSplitWin"; challengeId: number }
  | { type: "claimCreatorSplitWinRefund"; challengeId: number }
  | { type: "claimRefund"; challengeId: number }
  | { type: "complete"; challengeId: number }
  | { type: "create"; form: CreateChallengeFormData }

export const useChallengeActions = () => {
  const { t } = useTranslation()
  const challengesAddr = getConfig().challengesContractAddress
  const b3trAddr = getConfig().b3trContractAddress
  const { account } = useWallet()
  const queryClient = useQueryClient()
  const scheduledRefetchesRef = useRef<number[]>([])

  const clearScheduledRefetches = useCallback(() => {
    scheduledRefetchesRef.current.forEach(timeoutId => window.clearTimeout(timeoutId))
    scheduledRefetchesRef.current = []
  }, [])

  useEffect(() => clearScheduledRefetches, [clearScheduledRefetches])

  const refetchChallengeQueries = useCallback(async () => {
    const claimEventKeys = [
      challengePayoutClaimedEventName,
      challengeRefundClaimedEventName,
      splitWinPrizeClaimedEventName,
      splitWinCreatorRefundedEventName,
    ]
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["challenges"] }),
      ...claimEventKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })),
      queryClient.refetchQueries({ queryKey: ["challenges", "section"], type: "active" }),
      queryClient.refetchQueries({ queryKey: ["challenges", "detail"], type: "active" }),
      ...claimEventKeys.map(key => queryClient.refetchQueries({ queryKey: [key], type: "active" })),
    ])
  }, [queryClient])

  const scheduleFollowUpRefetches = useCallback(() => {
    clearScheduledRefetches()
    ;[1500, 4000, 8000].forEach(delay => {
      const timeoutId = window.setTimeout(() => {
        void refetchChallengeQueries()
      }, delay)
      scheduledRefetchesRef.current.push(timeoutId)
    })
  }, [clearScheduledRefetches, refetchChallengeQueries])

  const refetchQueryKeys = useMemo(
    () => [["challenges"], getB3trBalanceQueryKey(account?.address ?? "")],
    [account?.address],
  )

  const clauseBuilder = useCallback(
    (params: ActionParams): EnhancedClause[] => {
      switch (params.type) {
        case "create": {
          const { form } = params
          const weiAmount = ethers.parseEther(form.stakeAmount)
          const clauses: EnhancedClause[] = []

          if (weiAmount > 0n) {
            clauses.push(
              buildClause({
                contractInterface: B3TRInterface,
                to: b3trAddr,
                method: "approve",
                args: [challengesAddr, weiAmount],
                comment: t("Approve {{amount}} B3TR for B3MO Quest", { amount: form.stakeAmount }),
              }),
            )
          }

          clauses.push(
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "createChallenge",
              args: [
                {
                  kind: form.kind,
                  visibility: form.visibility,
                  challengeType: form.challengeType,
                  stakeAmount: weiAmount,
                  startRound: form.startRound,
                  endRound: form.endRound,
                  threshold: BigInt(form.threshold || "0"),
                  numWinners: BigInt(form.numWinners || "0"),
                  appIds: form.appIds,
                  invitees: form.invitees,
                  title: form.title,
                  description: form.description,
                  imageURI: form.imageURI,
                  metadataURI: form.metadataURI,
                },
              ],
              comment: t("Create B3MO Quest"),
            }),
          )

          return clauses
        }

        case "join": {
          const { challenge } = params
          const clauses: EnhancedClause[] = []

          if (challenge.kind === ChallengeKind.Stake) {
            clauses.push(
              buildClause({
                contractInterface: B3TRInterface,
                to: b3trAddr,
                method: "approve",
                args: [challengesAddr, ethers.parseEther(challenge.stakeAmount)],
                comment: t("Approve {{amount}} B3TR", { amount: challenge.stakeAmount }),
              }),
            )
          }

          clauses.push(
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "joinChallenge",
              args: [challenge.challengeId],
              comment: t("Join B3MO Quest #{{id}}", { id: challenge.challengeId }),
            }),
          )
          return clauses
        }

        case "leave": {
          const { challenge } = params
          const clauses: EnhancedClause[] = [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "leaveChallenge",
              args: [challenge.challengeId],
              comment: t("Leave B3MO Quest #{{id}}", { id: challenge.challengeId }),
            }),
          ]

          // Contract re-adds the user to the invited list on leave if they were
          // ever invited (invitationEligible stays true), landing them back in the
          // "invited" state. Chain a decline to fully opt out.
          if (challenge.wasInvited) {
            clauses.push(
              buildClause({
                contractInterface: ChallengesInterface,
                to: challengesAddr,
                method: "declineChallenge",
                args: [challenge.challengeId],
                comment: t("Decline B3MO Quest #{{id}}", { id: challenge.challengeId }),
              }),
            )
          }

          return clauses
        }

        case "decline":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "declineChallenge",
              args: [params.challengeId],
              comment: t("Decline B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "cancel":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "cancelChallenge",
              args: [params.challengeId],
              comment: t("Cancel B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "addInvites":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "addInvites",
              args: [params.challengeId, params.invitees],
              comment: t("Add invites to B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "claimPayout":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimChallengePayout",
              args: [params.challengeId],
              comment: t("Claim prize for B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "claimSplitWin":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimSplitWinPrize",
              args: [params.challengeId],
              comment: t("Claim Split Win slot for B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "claimCreatorSplitWinRefund":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimCreatorSplitWinRefund",
              args: [params.challengeId],
              comment: t("Refund unclaimed Split Win slots for B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "claimRefund":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimChallengeRefund",
              args: [params.challengeId],
              comment: t("Claim refund for B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]

        case "complete":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "completeChallenge",
              args: [params.challengeId],
              comment: t("Complete B3MO Quest #{{id}}", { id: params.challengeId }),
            }),
          ]
      }
    },
    [challengesAddr, b3trAddr, t],
  )

  const tx = useBuildTransaction<ActionParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: scheduleFollowUpRefetches,
    gasPadding: 0.3,
  })

  return {
    createChallenge: (form: CreateChallengeFormData) => tx.sendTransaction({ type: "create", form }),

    // accept = join (contract treats both the same)
    acceptChallenge: (challenge: ChallengeView) => tx.sendTransaction({ type: "join", challenge }),
    joinChallenge: (challenge: ChallengeView) => tx.sendTransaction({ type: "join", challenge }),

    leaveChallenge: (challenge: ChallengeView) => tx.sendTransaction({ type: "leave", challenge }),
    declineChallenge: (id: number) => tx.sendTransaction({ type: "decline", challengeId: id }),
    cancelChallenge: (id: number) => tx.sendTransaction({ type: "cancel", challengeId: id }),
    addInvites: (id: number, invitees: string[]) =>
      tx.sendTransaction({ type: "addInvites", challengeId: id, invitees }),
    claimChallenge: (id: number) => tx.sendTransaction({ type: "claimPayout", challengeId: id }),
    claimSplitWinPrize: (id: number) => tx.sendTransaction({ type: "claimSplitWin", challengeId: id }),
    claimCreatorSplitWinRefund: (id: number) =>
      tx.sendTransaction({ type: "claimCreatorSplitWinRefund", challengeId: id }),
    refundChallenge: (id: number) => tx.sendTransaction({ type: "claimRefund", challengeId: id }),
    completeChallenge: (id: number) => tx.sendTransaction({ type: "complete", challengeId: id }),

    status: tx.status,
    txReceipt: tx.txReceipt,
  }
}
