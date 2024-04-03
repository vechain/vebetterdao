import { Page } from 'playwright';
import { HOMEPAGE } from '../utils/constants';
import { expect } from '@playwright/test';
import veWorldMockClient from '../utils/veworld-mock-client';
import BigNumber from 'bignumber.js';
import { SwapDialog } from './swapDialog';

/**
 * Dashboard page model
 */
export class DashboardPage {
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

    /**
     * Visit the dashboard page
     */
    async visit() {
        await this.page.goto(HOMEPAGE)
    }

    /**
     * Connect wallet
     * @returns address of connected wallet
     */
    async connectWallet(): Promise<string> {
        await expect(this.page.getByText('Connect Wallet').first()).toBeVisible();
        await this.page.locator('xpath=//button[contains(text(), "Connect Wallet")]').first().click();
        await this.page.locator('div.modal-body button.card.LIGHT').first().click();
        const mockAddress = await veWorldMockClient.getMockAddress(this.page);
        console.log('connected wallet address', mockAddress)
        const trimmedAddress = mockAddress.slice(-6)
        await expect(this.page.locator(`xpath=//p[contains(text(), "${trimmedAddress}")]`).first()).toBeVisible();
        return mockAddress
    }

    /**
     * Disconnect wallet
     * @param address address of connected wallet
     */
    async disconnectWallet(address: string) {
        const trimmedAddress = address.slice(-6)
        await expect(this.page.locator(`xpath=//p[contains(text(), "${trimmedAddress}")]`).first()).toBeVisible();
        await this.page.locator(`xpath=//p[contains(text(), "${trimmedAddress}")]`).first().click();
        await this.page.locator('div.modal-footer button.LIGHT').first().click(); 
        await expect(this.page.getByText('Connect Wallet').first()).toBeVisible();
    }

    /**
     * Get B3TR balance of connected wallet
     * @returns B3TR balance
     */
    async getB3TRBalance(): Promise<BigNumber> {
        const text = await this.page.locator('xpath=//p[contains(text(),"B3TR Tokens")]/preceding-sibling::h2').first().textContent()
        const textBalance = text ?? (() => { throw new Error('B3TR balance not found') })()
        const balance = new BigNumber(textBalance)
        return balance
    }

    /**
     * Expect B3TR balance to be equal to expected balance
     * @param expectedBalance expected B3TR balance
     */
    async expectB3TRBalance(expectedBalance: BigNumber) {
        // retrying assertion
        await expect(this.page.locator('xpath=//p[contains(text(),"B3TR Tokens")]/preceding-sibling::h2')
            .first()
        ).toHaveText(expectedBalance.toString())
    }

    /**
     * Get VOT3 balance of connected wallet
     * @returns VOT3 balance
     */
    async getVOT3Balance(): Promise<BigNumber> {
        const text = await this.page.locator('xpath=//p[contains(text(),"VOT3 Tokens")]/preceding-sibling::h2').first().textContent()
        const textBalance = text ?? (() => { throw new Error('VOT3 balance not found') })()
        const balance = new BigNumber(textBalance)
        return balance
    }

    /**
     * Expect VOT3 balance to be equal to expected balance
     * @param expectedBalance expected VOT3 balance
     */
    async expectVOT3Balance(expectedBalance: BigNumber) {
        // retrying assertion
        await expect(this.page.locator('xpath=//p[contains(text(),"VOT3 Tokens")]/preceding-sibling::h2')
            .first()
        ).toHaveText(expectedBalance.toString())
    }

    /**
     * Click on swap button and wait for dialog to be visible
     */
    async clickSwapButton() {
        await this.page.locator('xpath=//button[contains(text(), "Swap")]').first().click();
        await expect(this.page.locator('section[role="dialog"]').first()).toBeVisible();
        return new SwapDialog(this.page)
    }


}