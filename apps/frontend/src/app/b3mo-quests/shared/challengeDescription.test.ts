import { describe, expect, it } from "vitest"

import { getCustomChallengeDescription, getPublicChallengeDescription } from "./challengeDescription"

describe("getCustomChallengeDescription", () => {
  it("returns the creator-provided description", () => {
    expect(getCustomChallengeDescription({ description: "  Complete three sustainable actions  " })).toBe(
      "Complete three sustainable actions",
    )
  })

  it.each([undefined, "", "   "])("keeps the generated-description fallback for %p", description => {
    expect(getCustomChallengeDescription({ description })).toBeNull()
  })
})

describe("getPublicChallengeDescription", () => {
  it("keeps and trims descriptions for public quests", () => {
    expect(getPublicChallengeDescription("  Join the campaign  ", true)).toBe("Join the campaign")
  })

  it("clears descriptions for private quests", () => {
    expect(getPublicChallengeDescription("Hidden stale value", false)).toBe("")
  })
})
