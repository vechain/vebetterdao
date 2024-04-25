import { Page } from 'playwright';
import { Locator, test } from '@playwright/test';
import { expectToastToBeVisible } from './toastNotification';
import { RoundStartedDialog } from './roundStartedDialog';

/**
 * Admin page model
 */
export class AdminPage {
    private page: Page
    readonly startEmissionsButton: Locator


    constructor(page: Page) {
        this.page = page

        this.startEmissionsButton = this.page.locator('xpath=//button[contains(text(), "Start emissions")]')
    }

    /**
     * Click start emissions
     */
    async startEmissions() {
        await test.step('Start emissions', async() => {
            await this.startEmissionsButton.first().click()
            await expectToastToBeVisible(this.page, 'Emissions started successfully', 'success')
        })
    }

    /**
     * Click on start new allocation round
     * @returns RoundStartedDialog
     */
    async startAllocationRound(): Promise<RoundStartedDialog> {
        return await test.step('Start new allocation round', async() => {
            await this.page.locator('xpath=//button[contains(text(), "Start new round")]').first().click()
            return new RoundStartedDialog(this.page)
        })
    }



}