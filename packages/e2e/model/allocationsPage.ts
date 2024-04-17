import { Page } from 'playwright';
import { test, expect, Locator } from '@playwright/test';
import { RoundsPage } from './roundsPage';
import { time } from 'console';
import { delay } from '../utils/delay';

/**
 * Allocations page model
 */
export class AllocationsPage {
    private page: Page
    readonly pageTitleText: Locator

    constructor(page: Page) {
        this.page = page
        this.pageTitleText = this.page.locator('xpath=//h2[contains(text(), "Total Allocations")]')
    }

    /**
     * Assert on allocations page
     */
    async expectOnPage() {
        await test.step('Expect on allocations page', async() => {
            await expect(this.pageTitleText.first()).toBeVisible()
        })
    }

    /**
     * Click on the round, this asserts the round page is displayed
     * @param roundIndex index of the round
     * @returns RoundsPage
     */
    async clickOnRound(roundIndex: number, timeout: number = 60000): Promise<RoundsPage> {
        return await test.step(`Click on round #${roundIndex}`, async() => {
            const id = `round-#${roundIndex}-card`
            const roundsPage = new RoundsPage(this.page)
            let counter = 0
            for (counter = 0; counter < 5; counter++) {
                const visible = await roundsPage.roundTitleText.isVisible()
                if (!visible) {
                    try {
                        await this.page.getByTestId(id).click()
                        await roundsPage.expectOnPage(roundIndex, Math.floor(timeout / 5))
                    } catch {}
                } else {
                    break
                }
                await delay(1000)
            }
            if (counter === 5) {
                await roundsPage.expectOnPage(roundIndex)
            }
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
            const xpath = `xpath=//p[@data-testid="round-#${roundIndex}-status"]`
            await expect(this.page.locator(xpath)).toContainText(state)
        })
    }

    /**
     * Expects the round to be displayed
     * @param roundIndex index of the round
     */
    async expectRoundStatusToBeDisplayed(roundIndex: number) {
        await test.step(`Expect round #${roundIndex} status to be displayed`, async() => {
            const xpath = `xpath=//p[@data-testid="round-#${roundIndex}-status"]`
            await expect(this.page.locator(xpath)).toBeVisible()
        })
    }

}