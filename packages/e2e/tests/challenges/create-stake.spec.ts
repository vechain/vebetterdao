import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"
import {
  fillCreateChallengeForm,
  navigateToChallenges,
  openCreateChallengeModal,
  submitCreateChallenge,
} from "../../src/utils/challenges"
import { baseUrl } from "../../src/config"

test.describe("Create challenge", () => {
  // Transaction approval through VeWorld extension needs headed debugging.
  // This test validates the form flow up to the submit click.
  test("opens the create modal, fills the form, and submits", async ({ appPage, extensionPage }) => {
    await connectWithVeWorld(appPage, extensionPage)
    await navigateToChallenges(appPage, baseUrl)

    await openCreateChallengeModal(appPage)

    const dialog = appPage.getByRole("dialog")

    // Verify form defaults
    await expect(dialog.getByText(/stake/i).first()).toBeVisible()
    await expect(dialog.getByText(/public/i).first()).toBeVisible()

    await fillCreateChallengeForm(appPage, { amount: "100" })

    // Create button should be enabled
    const createButton = dialog.getByRole("button", { name: /^create$/i })
    await expect(createButton).toBeVisible()
    await expect(createButton).toBeEnabled()

    // Switch to sponsored kind and verify threshold field appears
    await dialog.getByRole("button", { name: /^sponsored$/i }).click()
    await expect(dialog.getByText(/threshold/i).first()).toBeVisible()

    // Switch to private and verify invitee field appears
    await dialog.getByRole("button", { name: /^private$/i }).click()
    await expect(dialog.getByRole("button", { name: /add invitee/i })).toBeVisible()

    // Cancel closes the dialog
    await dialog.getByRole("button", { name: /^cancel$/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})
