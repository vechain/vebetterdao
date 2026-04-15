import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"
import { navigateToChallenges, waitForClearPage } from "../../src/utils/challenges"
import { baseUrl } from "../../src/config"

test.describe("Challenge detail page", () => {
  test("shows challenge-not-found for an invalid id", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await appPage.goto(`${baseUrl}/challenges/999999`, { waitUntil: "domcontentloaded" })
    await appPage.waitForLoadState("networkidle")
    await waitForClearPage(appPage)

    await expect(appPage.getByText(/challenge not found/i)).toBeVisible({ timeout: 30_000 })
    await expect(appPage.getByText(/back to challenges/i)).toBeVisible()
  })

  test("navigates from hub card to detail and back", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    const challengeLink = appPage.getByRole("link", { name: /challenge #/i }).first()
    const hasChallenges = await challengeLink.isVisible().catch(() => false)

    if (!hasChallenges) {
      test.skip(true, "No challenges on local chain — skipping detail navigation test")
      return
    }

    await challengeLink.click()
    await waitForClearPage(appPage)
    await expect(appPage.getByText(/challenge #/i).first()).toBeVisible({ timeout: 15_000 })

    await expect(appPage.getByText(/prize/i).first()).toBeVisible()
    await expect(appPage.getByText(/participants/i).first()).toBeVisible()
    await expect(appPage.getByText(/rounds/i).first()).toBeVisible()

    await appPage.getByText(/back to challenges/i).click()
    await expect(appPage.getByRole("heading", { name: /^challenges$/i })).toBeVisible({ timeout: 15_000 })
  })
})
