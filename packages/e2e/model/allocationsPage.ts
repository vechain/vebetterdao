import { Page } from "playwright"
import { test, expect, Locator } from "@playwright/test"
import { RoundsPage } from "./roundsPage"
import { delay } from "../utils/delay"
import { RoundIndex, RoundStatus } from "./types"
import { BasePage } from "./basePage"
import { MenuBar } from "./menuBar"

/**
 * Allocations page model
 */
export class AllocationsPage extends BasePage {
  readonly pageTitleText: Locator
  readonly latestRoundCard: Locator
  readonly latestRoundStatus: Locator
  readonly roundHeaderCard: Locator
  readonly roundCardByIndex: (i: RoundIndex) => Locator
  readonly roundStatusByIndex: (i: RoundIndex) => Locator

  constructor(page: Page) {
    super(page)

    this.pageTitleText = this.page.locator('xpath=//h2[contains(text(), "Allocations")]')
    this.latestRoundCard = this.page.locator('//div[contains(@data-testid, "round-card-#")]').first()
    this.roundCardByIndex = (i: RoundIndex) => {
      return i === "latest"
        ? this.page.locator('//div[contains(@data-testid, "round-card-#")]').first()
        : this.page.getByTestId(`round-card-#${i}`)
    }
    this.roundStatusByIndex = (i: RoundIndex) => {
      return this.roundCardByIndex(i).getByTestId("round-status")
    }
    this.latestRoundStatus = this.latestRoundCard.getByTestId("round-status")
    this.roundHeaderCard = this.page.getByTestId("allocation-round-header-card")
  }

  /**
   * Wait for the round to have a specific status
   * @param roundIndex
   * @param status
   */
  async waitForRoundStatus(roundIndex: RoundIndex, status: RoundStatus) {
    await test.step(`Wait for round #${roundIndex} state to be "${status}"`, async () => {
      const maxAttempts: number = 10
      let attemptsLeft: number = maxAttempts
      let isExpectedStatus: boolean = false
      let lastStatus: string = ""

      // Retry until the expected status is reached or all refresh attempts are depleted
      while (attemptsLeft > 0 && !isExpectedStatus) {
        try {
          attemptsLeft--
          lastStatus = await this.roundStatusByIndex(roundIndex).textContent()
          console.log(`\t Attempt #${maxAttempts - attemptsLeft}`)
          await expect(this.roundStatusByIndex(roundIndex)).toContainText(status)
          isExpectedStatus = true
        } catch (error) {
          console.log(
            lastStatus === "" // empty lastStatus means the round isn't on the list yet
              ? `\t Round #${roundIndex} isn't on the list yet. Waiting 5 sec then refreshing...\n\t Original error: ${error.message}`
              : `\t Round #${roundIndex} state: "${lastStatus}"; Expected: "${status}". Waiting 5 sec then refreshing...\n\t Original error: ${error.message}`,
          )
          await delay(5000)
          const menuBar = new MenuBar(this.page)
          await menuBar.gotoDashboard()
          await menuBar.gotoAllocations()
        }
      }

      // if expected status is reached - return; otherwise - throw an error
      if (isExpectedStatus) {
        return
      } else {
        throw new Error(
          `Round #${roundIndex} failed to turn into "${status}" state.\nLast status caught: "${lastStatus}"\nTotal refresh attempts used: ${maxAttempts - attemptsLeft}.`,
        )
      }
    })
  }

  async openRound(roundIndex: RoundIndex): Promise<RoundsPage> {
    return await test.step(`Open round #${roundIndex}`, async () => {
      const roundsPage: RoundsPage = new RoundsPage(this.page)
      await this.roundCardByIndex(roundIndex).click()
      await roundsPage.expectOnPage(roundIndex)
      return roundsPage
    })
  }

  /**
   * Assert on allocations page
   */
  async expectOnPage() {
    await test.step("Expect on allocations page", async () => {
      await this.page.waitForLoadState()
      await expect(this.pageTitleText.first()).toBeVisible()
    })
  }

  /**
   * Click on the round, this asserts the round page is displayed
   * Note: This click has proven problematic, so it has a retry mechanism
   * @param roundIndex index of the round
   * @param isVotable specifies if round is expected to be votable;
   *                   this arg is in place because sometimes "Cast your vote" button is not visible
   *                   despite the round being in "Active now" state
   * @returns RoundsPage
   */
  async clickOnRound(roundIndex: RoundIndex, isVotable = true): Promise<RoundsPage> {
    return await test.step(`Click on round #${roundIndex}`, async () => {
      const roundsPage = new RoundsPage(this.page)
      const menuBar = new MenuBar(this.page)
      const maxAttempts = 10
      let attemptsLeft = maxAttempts
      let isOpened = false

      while (attemptsLeft > 0 && !isOpened) {
        try {
          console.log(`\t Attempt #${maxAttempts - attemptsLeft + 1} to click on Round #${roundIndex}`)
          await this.roundCardByIndex(roundIndex).click()
          await expect(this.roundHeaderCard).toBeVisible()
          if (isVotable) await expect(new RoundsPage(this.page).castYourVoteButton).toBeVisible()
          isOpened = true
        } catch (error) {
          console.log(`\t Error clicking on round #${roundIndex}: ${error}`)
          await menuBar.gotoDashboard()
          await menuBar.gotoAllocations()
          attemptsLeft--
        } finally {
          await delay(3000)
        }
      }

      if (attemptsLeft === 0 || !isOpened) {
        console.log(`\t Failed to click on round #${roundIndex} after ${maxAttempts} attempts`)
        throw new Error(`Failed to click on round #${roundIndex}`)
      }
      await roundsPage.expectOnPage(roundIndex)
      return roundsPage
    })
  }

  /**
   * Expects the round to have displayed status. If "latest" passed in as @i, it will check the latest round (top of the list).
   * Otherwise, it will look for a round with a specific index, e.g. index "23" will make it look for a "Round #23" title.
   * @param {RoundIndex} i - index of the round
   * @param {RoundStatus} status - expected status (e.g. Active, Succeeded, Quorum failed)
   */
  async expectRoundStatus(i: RoundIndex, status: RoundStatus) {
    await test.step(`Expect latest round status to be "${status}"`, async () => {
      await expect(this.roundStatusByIndex(i)).toContainText(status)
    })
  }

  /**
   * Expects the round to be displayed
   * @param roundIndex index of the round
   */
  async expectRoundStatusToBeDisplayed(roundIndex: number) {
    await test.step(`Expect round #${roundIndex} status to be displayed`, async () => {
      const xpath = `xpath=//p[@data-testid="round-#${roundIndex}-status"]`
      await expect(this.page.locator(xpath)).toBeVisible()
    })
  }
}
