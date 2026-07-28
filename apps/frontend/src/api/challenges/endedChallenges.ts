import { ChallengeStatus, ChallengeView, ChallengeVisibility } from "./types"

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
 */
export const isEndedChallenge = (challenge: EndedChallengeCandidate, currentRound: number) =>
  challenge.status === ChallengeStatus.Completed ||
  (challenge.status === ChallengeStatus.Active && challenge.endRound < currentRound)

/**
 * Ended quests, newest first. Public and private quests are surfaced in separate rows,
 * so pass the `visibility` the row is for; omit it to get both.
 */
export const selectEndedChallenges = (
  challenges: ChallengeView[],
  currentRound: number,
  visibility?: ChallengeVisibility,
): ChallengeView[] =>
  challenges
    .filter(
      challenge =>
        isEndedChallenge(challenge, currentRound) && (visibility === undefined || challenge.visibility === visibility),
    )
    .sort((a, b) => b.challengeId - a.challengeId)
