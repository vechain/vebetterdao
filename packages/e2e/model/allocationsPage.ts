import { Page } from 'playwright';
import { test, expect, Locator } from '@playwright/test';
import { RoundsPage } from './roundsPage';
import { MenuBar } from './menuBar';
import { delay } from "../utils/delay"

/**
 * Allocations page model
 */
export class AllocationsPage {
    private page: Page
    readonly pageTitleText: Locator
    readonly roundStatusByRoundIndex: (roundIndex: number) => Locator

    constructor(page: Page) {
        this.page = page
        this.pageTitleText = this.page.locator('xpath=//h2[contains(text(), "Total Allocations")]')
        this.roundStatusByRoundIndex = (roundIndex) => { return this.page.getByTestId(`round-#${roundIndex}-status`) }
    }

    /**
     * Assert on allocations page
     */
    async expectOnPage() {
        await test.step('Expect on allocations page', async() => {
            await this.page.waitForLoadState()
            await expect(this.pageTitleText.first()).toBeVisible()
        })
    }

    /**
     * Click on the round, this asserts the round page is displayed
     * Note: This click has proven problematic, so it has a retry mechanism
     * @param roundIndex index of the round
     * @returns RoundsPage
     */
    async clickOnRound(roundIndex: number): Promise<RoundsPage> {
        return await test.step(`Click on round #${roundIndex}`, async() => {
            console.log(`Retry clicking on round #${roundIndex}`)
            const id = `round-#${roundIndex}-link`
            const roundsPage = new RoundsPage(this.page)
            let retry = 0
            const maxRetries = 10
            for (retry = 0; retry < maxRetries; retry++) {
                console.log(`\t Attempt #${retry + 1}`)
                try {
                    const visible = await this.page.getByTestId(id).isVisible()
                    if (visible) {
                        if (retry > 4) {
                            console.log(`\t Attempting reloading page`)
                            const menuBar = new MenuBar(this.page)
                            await menuBar.gotoDashbard()
                            await menuBar.gotoAllocations()
                            await delay(5000)
                        }
                        await this.page.getByTestId(id).blur()
                        await this.page.getByTestId(id).hover()
                        await this.page.getByTestId(id).focus()
                        await this.page.getByTestId(id).click()
                    } else {
                        break
                    }
                } catch (error) {
                    console.log(`\t Error clicking on round #${roundIndex}: ${error}`)
                } finally {
                    await delay(5000)
                }
            }
            if (retry >= maxRetries) {
                console.log(`\t Failed to click on round #${roundIndex} after ${retry} attempts`)
                throw new Error(`Failed to click on round #${roundIndex}`)
            }
            await roundsPage.expectOnPage(roundIndex)
            return roundsPage
        })
    }

    /**
     * Expects the round to have displayed status
     * @param roundIndex index of the round
     * @param state expected status (e.g. Active, Succeeded, Quorum failed)
     */
    async expectRoundStatus(roundIndex: number, state: string) {
        await test.step(`Expect round #${roundIndex} status to be ${state}`, async() => {
            const id = `round-#${roundIndex}-status`
            await expect(this.page.getByTestId(id)).toContainText(state)
        })
    }

    /**
     * Expects the round to be displayed
     * @param roundIndex index of the round
     */
    async expectRoundStatusToBeDisplayed(roundIndex: number) {
        await test.step(`Expect round #${roundIndex} status to be displayed`, async() => {
            await expect(this.roundStatusByRoundIndex(roundIndex)).toBeVisible()
        })
    }

}