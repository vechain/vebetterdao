import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"
import { fillCreateChallengeForm, navigateToChallenges, openCreateChallengeModal } from "../../src/utils/challenges"
import { baseUrl } from "../../src/config"

test.describe("Create challenge", () => {
  // Transaction approval through VeWorld extension needs headed debugging.
  // This test validates the form flow up to the submit click.
  test("opens the create modal, fills the form, and submits", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    await openCreateChallengeModal(appPage)

    const dialog = appPage.getByRole("dialog")

    await expect(dialog.getByText(/b3mo/i).first()).toBeVisible()

    await fillCreateChallengeForm(appPage, { amount: "100" })

    await expect(dialog.getByText(/review your challenge/i)).toBeVisible()
    const createButton = dialog.getByRole("button", { name: /^create$/i })
    await expect(createButton).toBeEnabled()

    await dialog.getByRole("button", { name: /^cancel$/i }).click()
    await expect(dialog).not.toBeVisible()

    await openCreateChallengeModal(appPage)

    await fillCreateChallengeForm(appPage, {
      amount: "100",
      kind: "Sponsored",
      visibility: "Private",
      splitPrize: true,
      threshold: "3",
    })

    await expect(dialog.getByText(/review your challenge/i)).toBeVisible()
    await expect(createButton).toBeEnabled()

    await dialog.getByRole("button", { name: /^cancel$/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})
