import { Page } from "playwright"
import { Locator, test, expect } from "@playwright/test"
import { AllocationVote, AppName } from "./types"
import { TxModalVoteCast } from "./TxModalVoteCast"

/**
 * Allocation rounds page model
 */
export class RoundsPage {
  private page: Page
  readonly castVoteButton: Locator
  readonly roundTitleText: Locator
  readonly quorumFailedError: Locator
  readonly castYourVoteButton: Locator
  readonly voteAppCard: (appName: AppName) => Locator
  readonly voteAppCheckbox: (appName: AppName) => Locator
  readonly continueButton: Locator
  readonly confirmVoteButton: Locator
  readonly voteAppInput: (appName: AppName) => Locator
  readonly votingConfirmationPageTitle: Locator
  readonly userVotesCard: Locator

  constructor(page: Page) {
    this.page = page
    this.castVoteButton = this.page.locator('xpath=//button[contains(text(), "Cast vote now")]')
    this.roundTitleText = this.page.getByTestId("round-title")
    this.quorumFailedError = this.page.locator('css=div[data-status="error"][role="alert"] div').first()
    this.castYourVoteButton = this.page.getByTestId("cast-your-vote-button")
    this.voteAppCheckbox = (appName: AppName) => this.page.getByTestId(`select-app-checkbox-${appName}`)
    this.continueButton = this.page.getByTestId("continue")
    this.confirmVoteButton = this.page.getByTestId("confirm-vote")
    this.voteAppInput = (appName: AppName) => this.page.getByTestId(`${appName}-vote-input`)
    this.votingConfirmationPageTitle = this.page.getByTestId("voting-confirmation-page-title")
    this.voteAppCard = (appName: AppName) => this.page.getByTestId(`vote-app-card-${appName}`)
    this.userVotesCard = this.page.getByTestId("user-votes-card")
  }

  /**
   * Assert on rounds page for a specific round
   * @param roundIndex index of round
   * @param timeout
   */
  async expectOnPage(roundIndex: number | "latest", timeout?: number) {
    await test.step(`Expect on round page: ${roundIndex}`, async () => {
      await this.page.waitForURL("**/rounds/*", { timeout: 10000 })
      await this.roundTitleText.waitFor({ state: "visible", timeout: 10000 })
      roundIndex === "latest"
        ? await expect(this.roundTitleText).toContainText("Round #", { timeout })
        : await expect(this.roundTitleText).toHaveText(`Round #${roundIndex}`, { timeout })
    })
  }

  // TODO: finish refactoring this method
  /**
   * Casts a users vote
   * @param votes
   */
  async castVote(votes: Array<AllocationVote>) {
    await test.step("Cast vote", async () => {
      // for (const vote of votes) {
      //   const appName = vote.appName
      //   const votePercentage = vote.votePercentage
      //   const xpath = `xpath=//input[@data-testid="${appName}-vote-input"]`
      //   // cast-your-vote-button
      //   await expect(this.page.locator(xpath).first()).toBeEnabled()
      //   await this.page.locator(xpath).first().scrollIntoViewIfNeeded()
      //   await this.page.locator(xpath).first().fill(String(votePercentage))
      // }
      // await this.castVoteButton.first().click()
      // const voteCastDialog = new VoteCastDialog(this.page)
      // await voteCastDialog.expectDialogSuccess()
      // await voteCastDialog.closeDialog()

      // select apps on the list and click Continue
      await this.castYourVoteButton.click()
      for (const vote of votes) {
        await this.selectAppToVoteFor(vote.appName)
      }
      await this.continueButton.click()

      // allocate votes
      for (const vote of votes) {
        await this.voteAppInput(vote.appName).fill(String(vote.votePercentage))
      }
      await this.continueButton.click()

      // confirm vote
      await this.votingConfirmationPageTitle.waitFor({ state: "visible", timeout: 10000 })
      await this.continueButton.click()
      await new TxModalVoteCast(this.page).expectPending()
      // await new TxModalVoteCast(this.page).expectSuccess()
      await this.userVotesCard.waitFor({ state: "visible", timeout: 10000 })
    })
  }

  async selectAppToVoteFor(appName: AppName) {
    await test.step(`Select the "${appName}" app for votes allocation`, async () => {
      // dataChecked is expected to be null if prop isn't on the element, hence - checkbox isn't checked
      const dataChecked = await this.voteAppCheckbox(appName).getAttribute("data-checked")
      if (dataChecked === null) await this.voteAppCard(appName).click()
    })
  }

  /**
   * Expect total votes under session info
   * This is the total votes power of all voters
   */
  async expectTotalVotes(totalVotes: number) {
    await test.step(`Expect total votes: ${totalVotes}`, async () => {
      await expect(this.page.getByTestId("total-votes").first()).toHaveText(String(totalVotes))
    })
  }

  /**
   * Expect total voters to be displayed
   * @param totalVoters Expected total voters
   */
  async expectTotalVoters(totalVoters: number) {
    await test.step(`Expect total voters: ${totalVoters}`, async () => {
      await expect(this.page.getByTestId("total-voters").first()).toHaveText(String(totalVoters))
    })
  }

  /**
   * Expect specified app to of gotten number of votes
   * @param appName App name
   * @param votes Number of votes
   */
  async expectAppVotes(appName: string, votes: number) {
    await test.step(`Expect app votes: ${appName} to be ${votes}`, async () => {
      await expect(this.page.getByTestId(`${appName}-votes-percentage`)).toHaveText(String(votes))
    })
  }

  /**
   * Expect page to display quorum was not reached
   */
  async expectQuorumNotReached() {
    await test.step("Expect quorum not reached", async () => {
      await expect(this.quorumFailedError).toContainText("Quorum was not reached for this round")
    })
  }
}
