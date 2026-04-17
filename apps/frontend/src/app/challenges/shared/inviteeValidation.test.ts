import { describe, expect, it } from "vitest"

import { countResolvedInvitees, getInviteeValidationError, parseInviteeValues } from "./inviteeValidation"

describe("inviteeValidation", () => {
  it("rejects invalid addresses, creator address, and duplicates", () => {
    const creator = "0x0000000000000000000000000000000000000001"
    const invitees = parseInviteeValues([creator, creator, "0x123"])
    const resolvedInviteeCounts = countResolvedInvitees(invitees)
    const creatorInvitee = invitees[0]!
    const duplicateInvitee = invitees[1]!
    const invalidInvitee = invitees[2]!

    expect(
      getInviteeValidationError({
        invitee: creatorInvitee,
        creatorAddress: creator,
        resolvedInviteeCounts,
      }),
    ).toBe("creator_cannot_be_invited")
    expect(
      getInviteeValidationError({
        invitee: duplicateInvitee,
        resolvedInviteeCounts,
      }),
    ).toBe("duplicate_address")
    expect(
      getInviteeValidationError({
        invitee: invalidInvitee,
        resolvedInviteeCounts,
      }),
    ).toBe("invalid_wallet_address")
  })

  it("normalizes resolved domains before checking duplicates and existing invitees", () => {
    const resolvedAddress = "0x0000000000000000000000000000000000000002"
    const invitees = parseInviteeValues(["alice.vet", resolvedAddress], [resolvedAddress.toUpperCase()])
    const resolvedInviteeCounts = countResolvedInvitees(invitees)
    const domainInvitee = invitees[0]!
    const duplicateInvitee = invitees[1]!

    expect(
      getInviteeValidationError({
        invitee: domainInvitee,
        existingInvitees: new Set([resolvedAddress]),
        resolvedInviteeCounts,
      }),
    ).toBe("already_invited")
    expect(
      getInviteeValidationError({
        invitee: duplicateInvitee,
        resolvedInviteeCounts,
      }),
    ).toBe("duplicate_address")
  })

  it("waits for domain resolution before flagging an invalid domain", () => {
    const invitees = parseInviteeValues(["alice.vet"])
    const resolvedInviteeCounts = countResolvedInvitees(invitees)
    const domainInvitee = invitees[0]!

    expect(
      getInviteeValidationError({
        invitee: domainInvitee,
        resolvedInviteeCounts,
        isResolvingDomains: true,
      }),
    ).toBeNull()
    expect(
      getInviteeValidationError({
        invitee: domainInvitee,
        resolvedInviteeCounts,
      }),
    ).toBe("invalid_domain")
  })
})
