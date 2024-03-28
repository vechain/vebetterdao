import { Page } from 'playwright';
import { expect } from '@playwright/test';
import { TX_RECEIPT_TIMEOUT } from '../utils/constants';

/**
 * Swap dialog model
 */
export class SwapConfirmationDialog {
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

    /**
     * Expect text "Swap completed" in the dialog
     */
    async expectSwapCompleted() {
        await expect(this.page.locator('section[role="dialog"] h2').first()).toContainText('Swap Completed', 
            { timeout: 10000 })
    }

    /**
     * Click the X button to close the dialog
     */
    async closeDialog() {
        await this.page.locator('section[role="dialog"] button').first().click()
    }

}