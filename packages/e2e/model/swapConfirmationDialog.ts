import { Page } from 'playwright';
import { expect } from '@playwright/test';

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
        await expect(this.page.locator('section[role="dialog"] h2').first()).toContainText('Swap Completed')
    }

    /** 
     * Expect text "Error" in the dialog
     */
    async expectSwapFailed() {
        await expect(this.page.locator('section[role="dialog"] h2').first()).toContainText('Error')
    }

    /**
     * Click the X button to close the dialog
     */
    async closeDialog() {
        await this.page.locator('section[role="dialog"] button').first().click()
    }

}