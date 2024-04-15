import { Page } from 'playwright';
import { Locator, test } from '@playwright/test';
import { AdminPage } from './adminPage';
import { DashboardPage } from './dashboardPage';
import { AllocationsPage } from './allocationsPage';

/**
 * Menu bar model
 */
export class MenuBar {
    private page: Page
    readonly dashBoardButton: Locator
    readonly adminButton: Locator
    readonly allocationsButton: Locator

    constructor(page: Page) {
        this.page = page

        this.dashBoardButton = this.page.locator('xpath=//button[contains(text(), "Dashboard")]')
        this.adminButton = this.page.locator('xpath=//button[contains(text(), "Admin")]')
        this.allocationsButton = this.page.locator('xpath=//button[contains(text(), "Allocations")]')
    }

    /**
     * Goto the dashboard page
     */
    async gotoDashbard(): Promise<DashboardPage> {
        return await test.step('Go to dashboard', async () => {
            await this.dashBoardButton.first().click();
            return new DashboardPage(this.page)
        })
    }

    /**
     * Goto the admin page
     */
    async gotoAdmin(): Promise<AdminPage> {
        return await test.step('Go to admin', async () => {
            await this.adminButton.first().click();
            return new AdminPage(this.page)
        })
    }

    /**
     * Goto allocations page
     */
    async gotoAllocations(): Promise<AllocationsPage> {
        return await test.step('Go to allocations', async () => {
            await this.allocationsButton.first().click();
            return new AllocationsPage(this.page)
        })
    }

}