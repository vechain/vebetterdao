import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it } from "mocha"
import { setupSignalingFixture } from "./fixture.test"

// V6 changed the storage key of per-round action counts from passport to actor.
// These tests pin the new semantics: each wallet's own actions count under that wallet,
// linked entities no longer pool into the passport slot, and PoP scores keep aggregating
// at the passport so isPerson is unchanged.
describe("VeBetterPassport V6 Actor-Keyed Counts - @shard8g", function () {
  it("count fields are keyed by the actor wallet, not the passport", async function () {
    const { veBetterPassport, owner, otherAccounts, appId } = await setupSignalingFixture()
    const passport = otherAccounts[2]
    const entity = otherAccounts[3]

    // Link entity → passport so that any action by `entity` resolves to `passport`.
    await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
    await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

    // 4 actions by the passport, 4 actions by the linked entity.
    for (let i = 0; i < 4; i++) {
      await veBetterPassport.connect(owner).registerActionForRound(passport.address, appId, 1)
      await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
    }

    // Each wallet's own counter holds only its own actions.
    expect(await veBetterPassport.userRoundActionCount(passport.address, 1)).to.equal(4)
    expect(await veBetterPassport.userRoundActionCount(entity.address, 1)).to.equal(4)
    expect(await veBetterPassport.userRoundActionCountApp(passport.address, 1, appId)).to.equal(4)
    expect(await veBetterPassport.userRoundActionCountApp(entity.address, 1, appId)).to.equal(4)
    expect(await veBetterPassport.userRoundAppCount(passport.address, 1)).to.equal(1)
    expect(await veBetterPassport.userRoundAppCount(entity.address, 1)).to.equal(1)
  })

  it("entity-as-participant zero-case is fixed: querying the entity returns its own actions", async function () {
    const { veBetterPassport, owner, otherAccounts, appId } = await setupSignalingFixture()
    const passport = otherAccounts[2]
    const entity = otherAccounts[3]

    await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
    await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)

    // Pre-V6 the entity's slot would have read 0 (everything routed to passport). Now it reads 2.
    expect(await veBetterPassport.userRoundActionCount(entity.address, 1)).to.equal(2)
    expect(await veBetterPassport.userRoundActionCountApp(entity.address, 1, appId)).to.equal(2)
  })

  it("score fields stay keyed by passport so PoP cumulative score still aggregates linked entities", async function () {
    const { veBetterPassport, owner, otherAccounts, appId } = await setupSignalingFixture()
    const passport = otherAccounts[2]
    const entity = otherAccounts[3]

    await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
    await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

    await veBetterPassport.connect(owner).registerActionForRound(passport.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)

    const securityMultiplier = await veBetterPassport.securityMultiplier(1)
    const expectedPassportScore = securityMultiplier * 3n

    // Score aggregates at the passport (3 actions total).
    expect(await veBetterPassport.userRoundScore(passport.address, 1)).to.equal(expectedPassportScore)
    // Entity's own score slot is 0 — scores route to passport, only counts route to actor.
    expect(await veBetterPassport.userRoundScore(entity.address, 1)).to.equal(0)

    // Same for the all-time / per-app score aggregates.
    expect(await veBetterPassport.userTotalScore(passport.address)).to.equal(expectedPassportScore)
    expect(await veBetterPassport.userAppTotalScore(passport.address, appId)).to.equal(expectedPassportScore)
    expect(await veBetterPassport.userRoundScoreApp(passport.address, 1, appId)).to.equal(expectedPassportScore)
  })

  it("appRoundActionCount continues to count every action regardless of actor", async function () {
    const { veBetterPassport, owner, otherAccounts, appId } = await setupSignalingFixture()
    const passport = otherAccounts[2]
    const entity = otherAccounts[3]

    await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
    await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

    await veBetterPassport.connect(owner).registerActionForRound(passport.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)

    // Global per-app counter unaffected by the keying change.
    expect(await veBetterPassport.appRoundActionCount(appId, 1)).to.equal(3)
  })

  it("self-passport (no linked entities) still increments only one slot", async function () {
    const { veBetterPassport, owner, otherAccounts, appId } = await setupSignalingFixture()
    const user = otherAccounts[4]

    await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)
    await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

    // Both score (passport-keyed) and count (actor-keyed) reads point to the same address here
    // since the user is their own passport.
    expect(await veBetterPassport.userRoundActionCount(user.address, 1)).to.equal(2)
    expect(await veBetterPassport.userRoundActionCountApp(user.address, 1, appId)).to.equal(2)
    const securityMultiplier = await veBetterPassport.securityMultiplier(1)
    expect(await veBetterPassport.userRoundScore(user.address, 1)).to.equal(securityMultiplier * 2n)
  })

  it("contract version is 6", async function () {
    const { veBetterPassport } = await setupSignalingFixture()
    expect(await veBetterPassport.version()).to.equal("6")
  })
})
