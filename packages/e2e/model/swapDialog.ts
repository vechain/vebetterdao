import { Page } from "playwright"
import { test, Locator } from "@playwright/test"
import BigNumber from "bignumber.js"
import { Currency } from "./types"

/**
 * Swap dialog model
 */
export class SwapDialog {
  private page: Page

  readonly getCurrencyButton: (getCurrency: Currency) => Locator
  readonly amountInput: (currency: Currency) => Locator
  readonly convertAll: Locator
  readonly confirmSwapButton: Locator

  constructor(page: Page) {
    this.page = page

    this.getCurrencyButton = (getCurrency: Currency) => this.page.getByTestId(`get-${getCurrency}-button`)
    this.amountInput = (currency: Currency) =>
      this.page.locator(`[data-testid='${currency}'] [data-testid='amount-input']`)
    this.convertAll = this.page.getByTestId("convert-all-button")
    this.confirmSwapButton = this.page.getByTestId("confirm-swap-button")
  }

  /**
   * Covers the flow of interacting with the swap modal.
   * Mind that "Convert tokens" button on the dashboard has to be clicked to call up the modal first.
   * @param amount
   * @param from
   * @param to
   */
  async swap(amount: number | string | BigNumber, from: Currency, to: Currency) {
    await test.step(`Swap ${amount} ${from} to ${to}`, async () => {
      await this.getCurrencyButton(to).click()
      await this.amountInput(from).fill(amount.toString())
      await this.confirmSwapButton.click()
    })
  }
}
