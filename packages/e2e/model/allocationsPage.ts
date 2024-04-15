import { Page } from 'playwright';
import { test, expect } from '@playwright/test';
import { RoundsPage } from './roundsPage';

/**
 * Allocations page model
 */
export class AllocationsPage {
    private page: Page

    constructor(page: Page) {
        this.page = page
    }

    /**
     * Click on the round
     * @param roundIndex index of the round
     * @returns RoundsPage
     */
    async clickOnRound(roundIndex: number): Promise<RoundsPage> {
        return await test.step(`Click on round #${roundIndex}`, async() => {
            const xpath = `xpath=//h3[text()[contains(.,"${roundIndex}")]]`
            await this.page.locator(xpath).first().click()
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