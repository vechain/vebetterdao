import { Page } from 'playwright';
import { expect, Locator, test } from '@playwright/test';

/**
 * Vost cast dialog model
 */
export class VoteCastDialog {
    private page: Page
    readonly dialogTitle: Locator
    readonly closeDialogButton: Locator
    
    
    constructor(page: Page) {
        this.page = page

        this.dialogTitle = this.page.locator('section[role="dialog"] h2')
        this.closeDialogButton = this.page.locator('section[role="dialog"] button')
    }

    /**
     * Expect text "Vote Cast!" in the dialog
     */
    async expectVoteCompleted() {
        await test.step('Expect vote cast dialog', async() => {
            await expect(this.dialogTitle.first()).toContainText('Vote Cast')
        })
    }

    /** 
     * Expect text "Error" in the dialog
     */
    async expectVoteFailed() {
        await test.step('Expect vote cast failed dialog', async() => {
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