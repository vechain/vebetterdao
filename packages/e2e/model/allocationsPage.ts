import { Page } from 'playwright';
import { test, expect, Locator } from '@playwright/test';
import { RoundsPage } from './roundsPage';

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
     * Click on the round
     * @param roundIndex index of the round
     * @returns RoundsPage
     */
    async clickOnRound(roundIndex: number): Promise<RoundsPage> {
        return await test.step(`Click on round #${roundIndex}`, async() => {
            const id = `round-#${roundIndex}-card`
            await expect(this.page.getByTestId(id)).toHaveCount(1)
            await this.page.getByTestId(id).blur()
            await this.page.getByTestId(id).hover()
            await this.page.getByTestId(id).focus()
            await this.page.getByTestId(id).click()
            return new RoundsPage(this.page)
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

}