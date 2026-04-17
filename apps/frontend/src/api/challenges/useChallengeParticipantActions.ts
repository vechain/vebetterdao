import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const abi = B3TRChallenges__factory.abi as any
const address = getConfig().challengesContractAddress as `0x${string}`
const ZERO_ADDR = "0x0000000000000000000000000000000000000000"

export type ChallengeParticipantActionsEntry = {
  participant: string
  actions: number
  position: number
}

export type ChallengeParticipantActionsData = {
  totalActions: number
  leaderboard: ChallengeParticipantActionsEntry[]
}

export const getChallengeParticipantActionsQueryKey = (challengeId: number, participants: string[]) => [
  "challenges",
  "participant-actions",
  challengeId,
  participants.join(","),
]

export const useChallengeParticipantActions = (challengeId: number, participants: string[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: getChallengeParticipantActionsQueryKey(challengeId, participants),
    queryFn: async (): Promise<ChallengeParticipantActionsData> => {
      if (!participants.length || !address || address.toLowerCase() === ZERO_ADDR) {
        return { totalActions: 0, leaderboard: [] }
      }

      const results = await executeMultipleClausesCall({
        thor,
        calls: participants.map(participant => ({
          abi,
          address,
          functionName: "getParticipantActions",
          args: [BigInt(challengeId), participant],
        })),
      })

      const sorted = participants
        .map((participant, index) => ({
          participant,
          actions: Number(results[index] ?? 0),
        }))
        .sort((a, b) => b.actions - a.actions)

      // Competition ranking: tied scores share the same rank (e.g. 1, 1, 3)
      // so all top-scorers are surfaced as winners by downstream UI.
      const leaderboard: ChallengeParticipantActionsEntry[] = sorted.map(entry => ({
        ...entry,
        position: sorted.findIndex(e => e.actions === entry.actions) + 1,
      }))

      return {
        totalActions: leaderboard.reduce((sum, entry) => sum + entry.actions, 0),
        leaderboard,
      }
    },
    enabled: !!thor && !!challengeId && participants.length > 0,
  })
}
