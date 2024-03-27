import { Page } from 'playwright';
import { HOMEPAGE } from '../utils/constants';
import { expect } from '@playwright/test';
import veWorldMockClient from '../utils/veworld-mock-client';
import BigNumber from 'bignumber.js';

/**
 * Swap dialog model
 */
export class SwapDialog {
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

     /**
     * Enters the first amount in the swap dialog
     * i.e. first input field
     * @param amount Decimal amount to enter
     */
     async enterFirstAmount(amount: BigNumber) {
        await this.page.locator('section[role="dialog"] input').first().fill(amount.toString());
    }

    /**
     * Enters the second amount in the swap dialog
     * i.e. second input field
     * @param amount Decimal amount to enter
     */
    async enterSecondAmount(amount: BigNumber) {
        await this.page.locator('section[role="dialog"] input').last().fill(amount.toString());
    }

    /**
     * Gets the second amount in the swap dialog
     * @returns Decimal amount
     */
    async getSecondAmount(): Promise<BigNumber> {
        const amount = await this.page.locator('section[role="dialog"] input').last().textContent()
        return new BigNumber(amount)
    }

    /**
     * Asserts the second amount in the swap dialog
     * @param amount decimal amount to assert
     */
    async expectSecondAmount(amount: BigNumber) {
        expect(this.page.locator('section[role="dialog"] input').last()).toHaveText(amount.toString())
    }

    /**
     * Clicks the "Max" button in the swap dialog
     */
    async clickMax() {
        await this.page.locator('xpath=//section[@role="dialog"]/descendant::button[contains(text(),"Max")]').first().click();
    }

    /**
     * Clicks the "Swap" button in the swap dialog
     */
    async clickSwap() {
        await this.page.locator('xpath=//section[@role="dialog"]/descendant::button[contains(text(),"Swap")]').first().click();
    }

    /**
     * Clicks the "Switch Tokens" button in the swap dialog
     */
    async clickSwitchTokens() {
        await this.page.locator('xpath=//section[@role="dialog"]/descendant::button[@aria-label="Switch Tokens"]').first().click();
    }
}