import { Page } from 'playwright';
import { Locator, test } from '@playwright/test';
import { expectToastToBeVisible } from './toastNotification';

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



}