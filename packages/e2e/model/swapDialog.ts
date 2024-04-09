import { Page } from 'playwright';
import { expect, test, Locator } from '@playwright/test';
import BigNumber from 'bignumber.js';

/**
 * Swap dialog model
 */
export class SwapDialog {
    private page: Page

    readonly firstTextBox: Locator
    readonly secondTextBox: Locator
    readonly maxButton: Locator
    readonly swapButton: Locator
    readonly switchTokensButton: Locator

    constructor(page: Page) {
        this.page = page

        this.firstTextBox = this.page.locator('section[role="dialog"] input').first()
        this.secondTextBox = this.page.locator('section[role="dialog"] input').last()
        this.maxButton = this.page.locator('xpath=//section[@role="dialog"]/descendant::button[contains(text(),"Max")]').first()
        this.swapButton = this.page.locator('xpath=//section[@role="dialog"]/descendant::button[contains(text(),"Swap")]').first()
        this.switchTokensButton = this.page.locator('xpath=//section[@role="dialog"]/descendant::button[@aria-label="Switch Tokens"]').first()
    }

     /**
     * Enters the first amount in the swap dialog
     * i.e. first input field
     * @param amount Decimal amount to enter
     */
     async enterFirstAmount(amount: BigNumber) {
        await test.step(`Entering first swap amount: ${amount}`, async() => {
            await this.firstTextBox.fill(amount.toString());
        })
    }

    /**
     * Enters the second amount in the swap dialog
     * i.e. second input field
     * @param amount Decimal amount to enter
     */
    async enterSecondAmount(amount: BigNumber) {
        await test.step(`Entering second swap amount: ${amount}`, async() => {
            await this.secondTextBox.fill(amount.toString());
        })
    }

    /**
     * Gets the second amount in the swap dialog
     * @returns Decimal amount
     */
    async getSecondAmount(): Promise<BigNumber> {
        return await test.step(`Getting second swap amount`, async() => {
            const text = await this.secondTextBox.textContent()
            const amount = text ?? (() => { throw new Error('Second amount not found') })()
            return new BigNumber(amount)
        })
    }

    /**
     * Asserts the second amount in the swap dialog
     * @param amount decimal amount to assert
     */
    async expectSecondAmount(amount: BigNumber) {
        await test.step(`Expecting second swap amount to be: ${amount}`, async() => {
            expect(this.secondTextBox).toHaveText(amount.toString())
        })
    }

    /**
     * Clicks the "Max" button in the swap dialog
     */
    async clickMax() {
        await test.step('Clicking max swap button', async() => {
            await this.maxButton.click();
        })
    }

    /**
     * Clicks the "Swap" button in the swap dialog
     */
    async clickSwap() {
        await test.step('Clicking swap button', async() => {
            await this.swapButton.click();
        })
    }

    /**
     * Clicks the "Switch Tokens" button in the swap dialog
     */
    async clickSwitchTokens() {
        await test.step('Clicking switch tokens button', async() => {
            await this.switchTokensButton.click();
        })
    }
}