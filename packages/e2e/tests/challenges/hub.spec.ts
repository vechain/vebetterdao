import { connectWithVeWorld, ensureVeWorldLoggedIn, expect, test } from "../../src/fixtures/veworld"
import { navigateToChallenges } from "../../src/utils/challenges"
import { baseUrl } from "../../src/config"

test.describe("Challenges hub page", () => {
  test("loads the challenges page with hub sections", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    await expect(appPage.getByRole("heading", { name: /^challenges$/i })).toBeVisible()
    await expect(appPage.getByRole("button", { name: /create challenge/i })).toBeVisible()
    await expect(appPage.getByRole("button", { name: /create sponsored challenge/i })).toBeVisible()

    // "Open to join" section is always rendered
    await expect(appPage.getByText(/open to join/i)).toBeVisible()
  })

  test("opens and closes the create challenge modal", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    await appPage.getByRole("button", { name: /create challenge/i }).click()
    const dialog = appPage.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/create challenge/i)).toBeVisible()
    await expect(dialog.locator("input[type='number']").first()).toBeVisible()

    await dialog.getByRole("button", { name: /^cancel$/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})
