import { Page } from "playwright"
import { Locator, test } from "@playwright/test"
import { RoundStartedDialog } from "./roundStartedDialog"
import { delay } from "../utils/delay"

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
      // TODO: WIP
      // await expect(this.page.getByTestId('tx-success-modal')).toBeVisible()
      // await expect(this.page.getByRole("heading", { name: "Emissions and rounds started!" })).toBeVisible()
      await delay(7000)
      // await this.closeModalButton.click()
    })
  }

  /**
   * Click on start new allocation round
   * @returns RoundStartedDialog
   */
  async startAllocationRound(): Promise<RoundStartedDialog> {
    return await test.step("Start new allocation round", async () => {
      // TODO: WIP
      // await this.page.getByTestId('start-voting-round-button').click()
      // await expect(this.page.getByTestId('tx-success-modal')).toBeVisible()
      // await this.closeModalButton.click()
      // return new RoundStartedDialog(this.page)
      await this.startEmissionsButton.click()
      await delay(5000)
      return new RoundStartedDialog(this.page)
    })
  }
}
