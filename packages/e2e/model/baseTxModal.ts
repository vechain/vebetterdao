import { Page } from "playwright"
import { expect, Locator, test } from "@playwright/test"

type RoundStartTitle = "Round started!" | "Error starting round" | "Starting emissions and rounds..."
type CastVoteTitle = "Vote Cast!" | "Error casting vote" | "Sending Transaction..."
type ClaimRewardsTitle = "Rewards claimed!" | ""
type TxModalTitles = {
  success: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
  error: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
  pending: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
}

/**
 * Base class for all dialogs
 */
export abstract class BaseTxModal {
  protected readonly page: Page
  protected readonly successTitle: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
  protected readonly errorTitle: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
  protected readonly pendingTitle: RoundStartTitle | CastVoteTitle | ClaimRewardsTitle
  protected readonly txModalTitle: Locator

  protected constructor(page: Page, titles: TxModalTitles) {
    this.page = page
    this.successTitle = titles.success
    this.errorTitle = titles.error
    this.pendingTitle = titles.pending
    this.txModalTitle = this.page.getByTestId("tx-modal-title")
  }

  /**
   * Expect the dialog to be displayed with success title
   */
  async expectSuccess() {
    await test.step(`Expect ${this.successTitle} dialog`, async () => {
      console.log(`[DEBUG] ${await this.txModalTitle.textContent()}`)
      await expect(this.txModalTitle).toHaveText(this.successTitle)
    })
  }

  /**
   * Expect the dialog to be displayed with error title
   */
  async expectError() {
    await test.step(`Expect ${this.errorTitle} dialog`, async () => {
      console.log(`[DEBUG] ${await this.txModalTitle.textContent()}`)
      await expect(this.txModalTitle).toHaveText(this.errorTitle)
    })
  }

  /**
   * Expect the dialog to be displayed with pending title
   */
  async expectPending() {
    await test.step(`Expect ${this.pendingTitle} dialog`, async () => {
      await expect(this.txModalTitle).toHaveText(this.pendingTitle)
    })
  }
}
