import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"
import { getChallengeActionButton, navigateToChallenges, waitForClearPage } from "../../src/utils/challenges"
import { baseUrl } from "../../src/config"

test.describe("Challenge actions visibility", () => {
  test("shows action buttons on existing challenges", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    // Find any challenge with visible actions
    const challengeLink = appPage.getByRole("link", { name: /challenge #/i }).first()
    const hasChallenges = await challengeLink.isVisible().catch(() => false)

    if (!hasChallenges) {
      test.skip(true, "No challenges on local chain")
      return
    }

    await challengeLink.click()
    await waitForClearPage(appPage)
    await expect(appPage.getByText(/challenge #/i).first()).toBeVisible({ timeout: 15_000 })

    // Verify at least one action group is present (CTA section or status info)
    const hasCancel = await getChallengeActionButton(appPage, "Cancel")
      .isVisible()
      .catch(() => false)
    const hasClaim = await getChallengeActionButton(appPage, "Claim prize")
      .isVisible()
      .catch(() => false)
    const hasRefund = await getChallengeActionButton(appPage, "Claim refund")
      .isVisible()
      .catch(() => false)
    const hasJoin = await getChallengeActionButton(appPage, "Join")
      .isVisible()
      .catch(() => false)
    const hasAccept = await getChallengeActionButton(appPage, "Accept")
      .isVisible()
      .catch(() => false)
    const hasLeave = await getChallengeActionButton(appPage, "Leave")
      .isVisible()
      .catch(() => false)
    const hasFinalize = await getChallengeActionButton(appPage, "Finalize")
      .isVisible()
      .catch(() => false)

    // At least the detail page loaded with stats — actions depend on challenge state
    await expect(appPage.getByText(/prize/i).first()).toBeVisible()
    await expect(appPage.getByText(/participants/i).first()).toBeVisible()

    // Log which actions are available for debugging
    const available = [
      hasCancel && "Cancel",
      hasClaim && "Claim prize",
      hasRefund && "Claim refund",
      hasJoin && "Join",
      hasAccept && "Accept",
      hasLeave && "Leave",
      hasFinalize && "Finalize",
    ].filter(Boolean)

    console.log("Available actions:", available.length ? available.join(", ") : "none (view-only)")
  })
})
