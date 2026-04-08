import { getConfig } from "@repo/config"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/factories/B3TR__factory"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

import { ChallengeKind, ChallengeView } from "./types"

const ChallengesInterface = B3TRChallenges__factory.createInterface()
const B3TRInterface = B3TR__factory.createInterface()

export interface CreateChallengeFormData {
  kind: number
  visibility: number
  thresholdMode: number
  stakeAmount: string
  startRound: number
  endRound: number
  threshold: string
  appIds: string[]
  invitees: string[]
}

type ActionParams =
  | { type: "join"; challenge: ChallengeView }
  | { type: "leave"; challengeId: number }
  | { type: "decline"; challengeId: number }
  | { type: "cancel"; challengeId: number }
  | { type: "addInvites"; challengeId: number; invitees: string[] }
  | { type: "claimPayout"; challengeId: number }
  | { type: "claimRefund"; challengeId: number }
  | { type: "finalize"; challengeId: number }
  | { type: "create"; form: CreateChallengeFormData }

export const useChallengeActions = () => {
  const challengesAddr = getConfig().challengesContractAddress
  const b3trAddr = getConfig().b3trContractAddress

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
                comment: `Approve ${form.stakeAmount} B3TR for challenge`,
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
                  thresholdMode: form.thresholdMode,
                  stakeAmount: weiAmount,
                  startRound: form.startRound,
                  endRound: form.endRound,
                  threshold: BigInt(form.threshold || "0"),
                  appIds: form.appIds,
                  invitees: form.invitees,
                },
              ],
              comment: "Create challenge",
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
                comment: `Approve ${challenge.stakeAmount} B3TR`,
              }),
            )
          }

          clauses.push(
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "joinChallenge",
              args: [challenge.challengeId],
              comment: `Join challenge #${challenge.challengeId}`,
            }),
          )
          return clauses
        }

        case "leave":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "leaveChallenge",
              args: [params.challengeId],
              comment: `Leave challenge #${params.challengeId}`,
            }),
          ]

        case "decline":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "declineChallenge",
              args: [params.challengeId],
              comment: `Decline challenge #${params.challengeId}`,
            }),
          ]

        case "cancel":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "cancelChallenge",
              args: [params.challengeId],
              comment: `Cancel challenge #${params.challengeId}`,
            }),
          ]

        case "addInvites":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "addInvites",
              args: [params.challengeId, params.invitees],
              comment: `Add invites to challenge #${params.challengeId}`,
            }),
          ]

        case "claimPayout":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimChallengePayout",
              args: [params.challengeId],
              comment: `Claim payout for challenge #${params.challengeId}`,
            }),
          ]

        case "claimRefund":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "claimChallengeRefund",
              args: [params.challengeId],
              comment: `Claim refund for challenge #${params.challengeId}`,
            }),
          ]

        case "finalize":
          return [
            buildClause({
              contractInterface: ChallengesInterface,
              to: challengesAddr,
              method: "finalizeChallenge",
              args: [params.challengeId],
              comment: `Finalize challenge #${params.challengeId}`,
            }),
          ]
      }
    },
    [challengesAddr, b3trAddr],
  )

  const tx = useBuildTransaction<ActionParams>({
    clauseBuilder,
    refetchQueryKeys: [["challenges"]],
    gasPadding: 0.3,
  })

  return {
    createChallenge: (form: CreateChallengeFormData) => tx.sendTransaction({ type: "create", form }),

    // accept = join (contract treats both the same)
    acceptChallenge: (challenge: ChallengeView) => tx.sendTransaction({ type: "join", challenge }),
    joinChallenge: (challenge: ChallengeView) => tx.sendTransaction({ type: "join", challenge }),

    leaveChallenge: (id: number) => tx.sendTransaction({ type: "leave", challengeId: id }),
    declineChallenge: (id: number) => tx.sendTransaction({ type: "decline", challengeId: id }),
    cancelChallenge: (id: number) => tx.sendTransaction({ type: "cancel", challengeId: id }),
    addInvites: (id: number, invitees: string[]) =>
      tx.sendTransaction({ type: "addInvites", challengeId: id, invitees }),
    claimChallenge: (id: number) => tx.sendTransaction({ type: "claimPayout", challengeId: id }),
    refundChallenge: (id: number) => tx.sendTransaction({ type: "claimRefund", challengeId: id }),
    finalizeChallenge: (id: number) => tx.sendTransaction({ type: "finalize", challengeId: id }),

    status: tx.status,
  }
}
