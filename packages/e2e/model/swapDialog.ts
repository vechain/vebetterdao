import { Page } from 'playwright';
import { expect, test, Locator, defineConfig as conf } from '@playwright/test';
import BigNumber from 'bignumber.js';
import { Token } from "./types"
import defineConfig from '../playwright.config'
const testId = defineConfig.use!.testIdAttribute

/**
 * Swap dialog model
 */
export class SwapDialog {
    private page: Page

    readonly sendCard: Locator
    readonly receiveCard: Locator
    readonly sendAmountInput: Locator
    readonly receiveAmountInput: Locator
    readonly maxButton: Locator
    readonly swapButton: Locator
    readonly switchTokensButton: Locator
    readonly swapSendTokenName: Locator
    readonly swapReceiveTokenName: Locator
    readonly closeBtn: Locator
    readonly amountInputByToken: (tokenName: Token) => Locator

    constructor(page: Page) {
        this.page = page

        this.sendCard = this.page.locator(`//*[contains(@${testId}, 'send-card')]`)
        this.receiveCard = this.page.locator(`//*[contains(@${testId}, 'receive-card')]`)
        this.sendAmountInput = this.sendCard.getByTestId('amount-input')
        this.receiveAmountInput = this.receiveCard.getByTestId('amount-input')
        this.maxButton = this.page.getByTestId('max-swap-btn')
        this.swapButton = this.page.getByTestId('swap-submit-btn')
        this.switchTokensButton = this.page.getByTestId('switch-tokens-btn')
        this.swapSendTokenName = this.page.locator(`//*[contains(@${testId}, 'swap-send')]`)
        this.swapReceiveTokenName = this.page.locator(`//*[contains(@${testId}, 'swap-receive')]`)
        this.closeBtn = this.page.getByTestId('modal-close-btn')
        this.amountInputByToken = (tokenName: Token) => {
            return this.page.locator(`//*[contains(@${testId}, "card-${tokenName.toLowerCase()}")]//*[@${testId}="amount-input"]`)
        }
    }

    /**
     * Switches "Swap Send" token to the one specified in tokenName arg
     * @param {Token} tokenName
     */
    async setSendToken(tokenName: Token) {
        await test.step(`Set send token to be "${tokenName}"`, async() => {
            if (await this.getSendTokenName() !== tokenName) {
                await this.clickSwitchTokens()
            }
        })
    }

    /**
     * Sets send swap amount to a given value
     * @param {number | string | BigNumber} amount
     */
    async setSendAmount(amount: number | string | BigNumber) {
        await test.step(`Set send swap amount to "${amount}"`, async () => {
            const swapAmount = typeof amount === 'string' ? amount : amount.toString()
            await this.sendAmountInput.fill(swapAmount)
        })
    }

    /**
     * Sets send swap amount to maximum value available
     */
    async setSendAmountToMax() {
        await test.step('Set send swap amount to max amount available', async () => {
            await this.maxButton.click()
        })
    }

    /**
     * Enters the first amount in the swap dialog
     * i.e. first input field
     * @param amount Decimal amount to enter
     */
    async enterSendAmount(amount: BigNumber) {
        await test.step(`Entering first swap amount: ${amount}`, async() => {
            await this.sendAmountInput.fill(amount.toString());
        })
    }

    /**
     * Enters the second amount in the swap dialog
     * i.e. second input field
     * @param amount Decimal amount to enter
     */
    async enterReceiveAmount(amount: BigNumber) {
        await test.step(`Entering second swap amount: ${amount}`, async() => {
            await this.receiveAmountInput.fill(amount.toString());
        })
    }

    /**
     * Gets the second amount in the swap dialog
     * @returns Decimal amount
     */
    async getSendAmount(): Promise<BigNumber> {
        return await test.step(`Getting second swap amount`, async() => {
            const text = await this.receiveAmountInput.textContent()
            const amount = text ?? (() => { throw new Error('Second amount not found') })()
            return new BigNumber(amount)
        })
    }

    /**
     * Asserts the second amount in the swap dialog
     * @param amount decimal amount to assert
     */
    async expectReceiveAmount(amount: BigNumber) {
        await test.step(`Expecting second swap amount to be: ${amount}`, async() => {
            await expect(this.receiveAmountInput).toHaveText(amount.toString())
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

    /**
     * Gets the name of a token in a swap pair that's currently set as "Send"
     * @returns {Token}
     */
    async getSendTokenName(): Promise<Token> {
        return await test.step('Get current send token name in the Swap modal', async () => {
            const testIdVal: string = await this.sendCard.getAttribute(testId)
            return testIdVal.substring(testIdVal.length - 4).toUpperCase() as Token
        })
    }

    /**
     * Gets the name of a token in a swap pair that's currently set as "Receive"
     * @returns {Token}
     */
    async getReceiveTokenName(): Promise<Token> {
        const testIdVal: string = await this.receiveCard.getAttribute(testId)
        return testIdVal.substring(testIdVal.length - 4).toUpperCase() as Token
    }

    /**
     * Closes swap modal
     */
    async closeSwapModal() {
        await test.step('Close swap modal', async() => {
            await this.closeBtn.click();
        })
    }

    /**
     * Verify that max amount for a given token is equal to an expected amount
     * @param {Token} tokenName
     * @param {string} amount
     */
    async expectMaxSwappableAmount(tokenName: Token, amount: string) {
        await test.step(`Expect Max swappable amount for "${tokenName}" to be "${amount}"`, async () => {
            await this.setSendToken(tokenName)
            await this.setSendAmountToMax()
            await expect(this.amountInputByToken(tokenName)).toHaveValue(amount)
        })
    }
}