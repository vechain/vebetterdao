import { Page } from "playwright"
import { expect, Locator, test } from "@playwright/test"
import { RoundStartedDialog } from "./roundStartedDialog"

/**
 * Admin page model
 */
export class AdminPage {
  private page: Page
  readonly startEmissionsButton: Locator
  readonly closeModalButton: Locator

  constructor(page: Page) {
    this.page = page

    this.startEmissionsButton = this.page.getByTestId("start-voting-round-button")
    this.closeModalButton = this.page.getByLabel("Close")
  }

  /**
   * Click start emissions
   */
  async startEmissions() {
    await test.step("Start emissions", async () => {
      await this.startEmissionsButton.click()
      await expect(this.page.getByRole("heading", { name: "Round started!" })).toBeVisible()
      await this.closeModalButton.click()
    })
  }

  /**
   * Click on start new allocation round
   * @returns RoundStartedDialog
   */
  async startAllocationRound(): Promise<RoundStartedDialog> {
    return await test.step("Start new allocation round", async () => {
      await this.page.locator('xpath=//button[contains(text(), "Start new round")]').first().click()
      return new RoundStartedDialog(this.page)
    })
  }
}
