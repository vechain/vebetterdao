import { Page } from 'playwright';
import { expect, Locator, test } from '@playwright/test';

/**
 * Swap dialog model
 */
export class SwapConfirmationDialog {
    private page: Page
    readonly dialogTitle: Locator
    readonly closeDialogButton: Locator
    
    
    constructor(page: Page) {
        this.page = page

        this.dialogTitle = this.page.locator('section[role="dialog"] h2')
        this.closeDialogButton = this.page.locator('section[role="dialog"] button')
    }

    /**
     * Expect text "Swap completed" in the dialog
     */
    async expectSwapCompleted() {
        await test.step('Expect swap completed dialog', async() => {
            await expect(this.dialogTitle.first()).toContainText('Swap Completed')
        })
    }

    /** 
     * Expect text "Error" in the dialog
     */
    async expectSwapFailed() {
        await test.step('Expect swap failed dialog', async() => {
            await expect(this.dialogTitle.first()).toContainText('Error')
        })
    }

    /**
     * Click the X button to close the dialog
     */
    async closeDialog() {
        await test.step('Close dialog', async() => {
            await this.closeDialogButton.first().click()
        })
    }

}