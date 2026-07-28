import { isChallengeParticipationVisible } from "./challengeParticipation"
import { ChallengeVisibility, ParticipantStatus } from "./types"

const outsider = {
  visibility: ChallengeVisibility.Private,
  isCreator: false,
  viewerStatus: ParticipantStatus.None,
  wasInvited: false,
}

describe("isChallengeParticipationVisible", () => {
  it("shows participation on public quests", () => {
    expect(isChallengeParticipationVisible({ ...outsider, visibility: ChallengeVisibility.Public })).toBe(true)
  })

  it("hides participation on private quests from outsiders", () => {
    expect(isChallengeParticipationVisible(outsider)).toBe(false)
  })

  it("shows participation to the creator, participants and invitees", () => {
    expect(isChallengeParticipationVisible({ ...outsider, isCreator: true })).toBe(true)
    expect(isChallengeParticipationVisible({ ...outsider, viewerStatus: ParticipantStatus.Joined })).toBe(true)
    expect(isChallengeParticipationVisible({ ...outsider, viewerStatus: ParticipantStatus.Invited })).toBe(true)
    expect(isChallengeParticipationVisible({ ...outsider, wasInvited: true })).toBe(true)
  })

  it("keeps showing participation to someone who declined or left", () => {
    expect(isChallengeParticipationVisible({ ...outsider, viewerStatus: ParticipantStatus.Declined })).toBe(true)
    // Leaving clears participantStatus back to None on-chain, but the invite flag survives.
    expect(isChallengeParticipationVisible({ ...outsider, wasInvited: true })).toBe(true)
  })
})
