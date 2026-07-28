import { ChallengeStatus, ChallengeView } from "./types"

type EndedChallengeCandidate = Pick<ChallengeView, "status" | "endRound">

/**
 * Whether a quest's competition window is over. Two on-chain shapes qualify:
 * - `Completed`: the contract settled it (every Split Win slot claimed, or the creator
 *   reclaimed the unclaimed pool after `endRound`).
 * - `Active` past its `endRound`: the window closed but nobody triggered settlement, so the
 *   stored status never moved on. `useWhatOthersAreDoingSection` drops these from the live
 *   carousel, so without this branch they stay invisible to everyone but their participants.
 *
 * `Cancelled` / `Invalid` quests never ran, so they are not "past" — they stay out.
 *
 * Private quests are included: a quest's existence, prize, rules and outcome are public
 * regardless of visibility. Only its participation stays private — see
 * `isChallengeParticipationVisible`.
 */
export const isEndedChallenge = (challenge: EndedChallengeCandidate, currentRound: number) =>
  challenge.status === ChallengeStatus.Completed ||
  (challenge.status === ChallengeStatus.Active && challenge.endRound < currentRound)

/** Ended quests, newest first. */
export const selectEndedChallenges = (challenges: ChallengeView[], currentRound: number): ChallengeView[] =>
  challenges
    .filter(challenge => isEndedChallenge(challenge, currentRound))
    .sort((a, b) => b.challengeId - a.challengeId)
