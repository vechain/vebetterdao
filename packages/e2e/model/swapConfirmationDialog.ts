import { Page } from "playwright"
import { expect, Locator, test } from "@playwright/test"

/**
 * Swap dialog model
 */
export class SwapConfirmationDialog {
  readonly page: Page
  readonly successTitle: Locator
  readonly errorTitle: Locator
  readonly closeDialogButton: Locator

  constructor(page: Page) {
    this.page = page
    this.successTitle = this.page.getByTestId("swap-success-title")
    this.errorTitle = this.page.getByTestId("modal-error-title")
    this.closeDialogButton = this.page.getByTestId("close-swap-modal-button")
  }

  async expectDialogSuccess() {
    await test.step(`Expect "transaction successful" dialog to be visible`, async () => {
      await expect(this.successTitle).toBeVisible()
    })
  }

  async expectDialogFailed() {
    await test.step(`Expect "transaction failed" dialog to be visible`, async () => {
      await expect(this.errorTitle).toBeVisible()
    })
  }

  async closeDialog() {
    await test.step("Close dialog", async () => {
      await this.closeDialogButton.click()
    })
  }
}
