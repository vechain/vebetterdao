import { ChallengeView, ChallengeVisibility, ParticipantStatus } from "./types"

type ChallengeParticipationViewer = Pick<ChallengeView, "visibility" | "isCreator" | "viewerStatus" | "wasInvited">

/**
 * Whether the viewer may see WHO took part in a quest.
 *
 * A private quest is discoverable like any other once it is over — title, prize, rules and
 * outcome are public — but its participation is not. Identities (creator, participants,
 * winners, invitees, and the addresses in the activity log) are shown only to the people
 * involved: the creator, anyone who joined, and anyone who was invited (including after
 * declining or leaving, since both keep them in the quest's history).
 */
export const isChallengeParticipationVisible = (challenge: ChallengeParticipationViewer) =>
  challenge.visibility === ChallengeVisibility.Public ||
  challenge.isCreator ||
  challenge.wasInvited ||
  challenge.viewerStatus !== ParticipantStatus.None
