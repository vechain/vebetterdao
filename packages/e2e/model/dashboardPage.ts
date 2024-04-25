import { Page } from 'playwright';
import { expect } from '@playwright/test';
import veWorldMockClient from '../utils/veworld-mock-client';
import BigNumber from 'bignumber.js';
import { SwapDialog } from './swapDialog';
import { test, Locator } from '@playwright/test';
import { trimmedAddress } from "../utils/address"

/**
 * Dashboard page model
 */
export class DashboardPage {
    private page: Page
    readonly connectWalletButton: Locator
    readonly veWorldOption: Locator
    readonly currentUserBtn: Locator
    readonly disconnectOption: Locator
    readonly b3trBalanceText: Locator
    readonly vot3BalanceText: Locator
    readonly swapButton: Locator
    readonly claimRewardsButton: Locator
    readonly votingRewardsAmount: string
    readonly mintNFTButton: Locator

    constructor(page: Page) {
        this.page = page

        this.connectWalletButton = this.page.getByTestId("connect-wallet-btn").first()
        this.veWorldOption = this.page.locator('div.modal-body button.card.LIGHT').first()
        this.currentUserBtn = this.page.getByTestId("address-btn")
        this.disconnectOption = this.page.locator('div.modal-footer button.LIGHT').first()
        this.b3trBalanceText = this.page.getByTestId("b3tr-balance")
        this.vot3BalanceText = this.page.getByTestId("vot3-balance")
        this.swapButton = this.page.getByTestId("swap-button")
        this.claimRewardsButton = this.page.locator('xpath=//button[contains(text(), "Claim")]')
        this.votingRewardsAmount = "voting-rewards"
        this.mintNFTButton = this.page.locator('xpath=//button[contains(text(), "Mint now")]')
    }

    /**
     * Connect wallet
     * @returns address of connected wallet
     */
    async connectWallet(): Promise<string> {
        return await test.step('Connect Wallet', async() => {
            await this.connectWalletButton.click();
            await this.veWorldOption.click();
            const mockAddress = await veWorldMockClient.getMockAddress(this.page);
            console.log('connected wallet address', mockAddress)
            await expect(this.currentUserBtn).toHaveText(trimmedAddress(mockAddress))
            return mockAddress
        })
    }

    /**
     * Disconnect wallet
     */
    async disconnectWallet() {
        await test.step('Disconnect Wallet', async() => {
            await this.currentUserBtn.click();
            await this.disconnectOption.click();
            await expect(this.connectWalletButton).toBeVisible();
        })
    }

    /**
     * Get B3TR balance of connected wallet
     * @returns B3TR balance
     */
    async getB3TRBalance(): Promise<BigNumber> {
        return await test.step('Getting B3TR balance', async() => {
            const text = await this.b3trBalanceText.first().textContent()
            const textBalance = text ?? (() => { throw new Error('B3TR balance not found') })()
            const fullTextBalance = textBalance.replace('K', '000')
            const balance = new BigNumber(fullTextBalance)
            console.log(`B3TR balance: ${balance}`)
            return balance
        })
    }

    /**
     * Expect B3TR balance to be equal to expected balance
     * @param expectedBalance expected B3TR balance
     */
    async expectB3TRBalance(expectedBalance: BigNumber) {
        await test.step(`Expect B3TR balance = ${expectedBalance}`, async() => {
            await expect(this.b3trBalanceText.first()).toHaveText(expectedBalance.toString())
        })
    }

    /**
     * Expect B3TR balance to be greater than expected balance
     * @param expectedBalance expected B3TR balance
     */
    async expectB3TRBalanceGreaterThan(expectedBalance: number) {
        await test.step(`Expect B3TR balance to be greater than ${expectedBalance}`, async() => {
            await expect(async() => {
                const balance = await this.getB3TRBalance()
                const expected = new BigNumber(expectedBalance)
                expect(balance.isGreaterThan(expected)).toBeTruthy()
            }).toPass()
        })
    }

    /**
     * Get VOT3 balance of connected wallet
     * @returns VOT3 balance
     */
    async getVOT3Balance(): Promise<BigNumber> {
        return await test.step('Getting VOT3 balance', async() => {
            const text = await this.vot3BalanceText.first().textContent()
            const textBalance = text ?? (() => { throw new Error('VOT3 balance not found') })()
            const fullTextBalance = textBalance.replace('K', '000')
            const balance = new BigNumber(fullTextBalance)
            return balance
        }) 
    }

    /**
     * Expect VOT3 balance to be equal to expected balance
     * @param expectedBalance expected VOT3 balance
     */
    async expectVOT3Balance(expectedBalance: BigNumber) {
        await test.step(`Expect VOT3 balance = ${expectedBalance}`, async() => {
            await expect(this.vot3BalanceText.first()).toHaveText(expectedBalance.toString())
        })
    }

    /**
     * Click on swap button and wait for dialog to be visible
     */
    async clickSwapButton(): Promise<SwapDialog> {
        return await test.step('Click Swap button', async() => { 
            await this.page.locator('xpath=//button[contains(text(), "Swap")]').first().click();
            await expect(this.page.locator('section[role="dialog"]').first()).toBeVisible();
            return new SwapDialog(this.page)
        })
    }

    /**
     * Click claim rewards button
     */
    async clickClaimRewards() {
        await test.step('Click Claim Rewards', async() => {
            await expect(this.claimRewardsButton.first()).toBeEnabled()
            await this.claimRewardsButton.first().click()
        })
    }

    /**
     * Click on Mint Now
     */
    async mintNFT() {
        await test.step('Click on Mint Now to mint NFT', async() => {
            await expect(this.mintNFTButton.first()).toBeEnabled()
            await this.mintNFTButton.first().click()
        })
    }

    /**
     * Assert that NFT is displayed
     * @param nftName Name of NFT e.g. GM Earth
     */
    async expectNFTToBeDisplayed(nftName: string) {
        await test.step(`Expect NFT ${nftName} to be displayed`, async() => {
            const xpath = `xpath=//p[contains(text(),"${nftName} #")]`
            await expect(this.page.locator(xpath).first()).toBeVisible()
        })
    }

}