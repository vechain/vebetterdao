import { Page } from "playwright"
import { Locator, test } from "@playwright/test"
import { TxModalRoundStart } from "./TxModalRoundStart"

/**
 * Admin page model
 */
export class AdminPage {
  private page: Page
  readonly startVotingRoundButton: Locator
  readonly startStatusModalTitle: Locator
  readonly closeModalButton: Locator
  readonly txModal: TxModalRoundStart

  constructor(page: Page) {
    this.page = page

    this.txModal = new TxModalRoundStart(page)
    this.startVotingRoundButton = this.page.getByTestId("start-voting-round-button")
    this.startStatusModalTitle = this.page.getByTestId("round-start-modal-title")
    this.closeModalButton = this.page.getByLabel("Close")
  }

  /**
   * Click on start new allocation round
   */
  async startAllocationRound() {
    await test.step("Start new allocation round", async () => {
      await this.startVotingRoundButton.click()
    })
  }
}
