// import { BaseTxModalPage } from "./baseTxModalPage"
import { Page } from "playwright"
import { BaseTxModal } from "./baseTxModal"
import { Locator, test } from "@playwright/test"

export class TxModalClaimRewards extends BaseTxModal {
  private readonly closeModalButton: Locator

  constructor(page: Page) {
    super(page, {
      success: "Rewards claimed!",
      error: "",
      pending: "",
    })

    this.closeModalButton = this.page.locator('button[aria-label="Close"]')
  }

  /**
   * Click the X button to close the dialog
   */
  async close() {
    await test.step("Close dialog", async () => {
      await this.closeModalButton.first().click()
    })
  }
}
