import { Page } from 'playwright';
import { expect, Locator, test } from '@playwright/test';
import exp from 'constants';

/**
 * Dialog for displaying GM NFT
 */
export class GMNFTDialog {
    private page: Page

    readonly dialogSection: Locator
    readonly closeButton: Locator
    readonly tokenID: Locator

    
    constructor(page: Page) {
        this.page = page
        this.dialogSection = this.page.getByTestId('gmnft-modal')
        this.closeButton = this.page.getByTestId('gmnft-modal-close')
        this.tokenID = this.page.getByTestId('gmnft-token-id')
    }

    /**
     * Expect the dialog to be displayed 
     */
    async expectDialogDisplayed(tokenId: number) {
        await test.step('Expect nft dialog to be visible', async() => {
            await expect(this.dialogSection).toBeVisible()
            await expect(this.tokenID).toBeVisible()
            await expect(this.tokenID).toContainText(`#${tokenId}`)
        })
    }

    /**
     * Click the X button to close the dialog
     */
    async closeDialog() {
        await test.step('Close the nft dialog', async() => {
            await this.closeButton.first().click()
        })
    }

}