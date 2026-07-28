import { ChallengeStatus, ChallengeView, ChallengeVisibility } from "./types"

type EndedChallengeCandidate = Pick<ChallengeView, "visibility" | "status" | "endRound">

/**
 * Whether a quest is a public quest whose competition window is over. Two on-chain
 * shapes qualify:
 * - `Completed`: the contract settled it (every Split Win slot claimed, or the creator
 *   reclaimed the unclaimed pool after `endRound`).
 * - `Active` past its `endRound`: the window closed but nobody triggered settlement, so the
 *   stored status never moved on. `useWhatOthersAreDoingSection` drops these from the live
 *   carousel, so without this branch they stay invisible to everyone but their participants.
 *
 * `Cancelled` / `Invalid` quests never ran, so they are not "past" — they stay out.
 */
export const isEndedPublicChallenge = (challenge: EndedChallengeCandidate, currentRound: number) =>
  challenge.visibility === ChallengeVisibility.Public &&
  (challenge.status === ChallengeStatus.Completed ||
    (challenge.status === ChallengeStatus.Active && challenge.endRound < currentRound))

/** Ended public quests, newest first. */
export const selectEndedChallenges = (challenges: ChallengeView[], currentRound: number): ChallengeView[] =>
  challenges
    .filter(challenge => isEndedPublicChallenge(challenge, currentRound))
    .sort((a, b) => b.challengeId - a.challengeId)
