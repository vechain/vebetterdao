import { Page } from 'playwright';
import { expect, Locator, test } from '@playwright/test';

/**
 * Base class for all dialogs
 */
export class BaseDialog {
    private page: Page
    private successTitle: string
    private errorTitle: string
    readonly dialogTitle: Locator
    readonly closeDialogButton: Locator
    
    
    constructor(page: Page, successTitle: string, errorTitle: string = "Error") {
        this.page = page
        this.successTitle = successTitle
        this.errorTitle = errorTitle
        this.dialogTitle = this.page.locator('//*[@data-testid="modal-title"]')
        this.closeDialogButton = this.page.locator('//*[@data-testid="modal-close-btn"]')
    }

    /**
     * Expect the dialog to be displayed with success title
     */
    async expectDialogSuccess() {
        await test.step('Expect vote cast dialog', async() => {
            await expect(this.dialogTitle.first()).toContainText(this.successTitle)
        })
    }

    /** 
     * Expect the dialog to be displayed with error title
     */
    async expectDialogFailed() {
        await test.step('Expect vote cast failed dialog', async() => {
            await expect(this.dialogTitle.first()).toContainText(this.errorTitle)
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