import { Page } from "playwright"
import { Locator, test, expect } from "@playwright/test"
import { AdminPage } from "./adminPage"
import { DashboardPage } from "./dashboardPage"
import { AllocationsPage } from "./allocationsPage"
import { SectionName } from "./types"

/**
 * Menu bar model
 */
export class MenuBar {
  private page: Page
  readonly dashBoardButton: Locator
  readonly adminButton: Locator
  readonly allocationsButton: Locator
  readonly currentSectionName: Locator

  constructor(page: Page) {
    this.page = page

    this.dashBoardButton = this.page.locator('xpath=//button[contains(text(), "Dashboard")]')
    this.adminButton = this.page.locator('xpath=//button[contains(text(), "Admin")]')
    this.allocationsButton = this.page.locator('xpath=//button[contains(text(), "Allocations")]')
    this.currentSectionName = this.page.getByTestId("current-section")
  }

  /**
   * Goto the dashboard page
   */
  async gotoDashbard(): Promise<DashboardPage> {
    return await test.step("Go to dashboard", async () => {
      await this.dashBoardButton.first().click()
      await this.waitUntilInSection("Dashboard")
      return new DashboardPage(this.page)
    })
  }

  /**
   * Goto the admin page
   */
  async gotoAdmin(): Promise<AdminPage> {
    return await test.step("Go to admin", async () => {
      await this.adminButton.first().click()
      await this.waitUntilInSection("Admin")
      return new AdminPage(this.page)
    })
  }

  /**
   * Goto allocations page
   */
  async gotoAllocations(): Promise<AllocationsPage> {
    return await test.step("Go to allocations", async () => {
      await expect(async () => {
        await this.allocationsButton.first().click()
        const allocationsPage = new AllocationsPage(this.page)
        await allocationsPage.expectOnPage()
      }).toPass()
      return new AllocationsPage(this.page)
    })
  }

  async waitUntilInSection(sectionName: SectionName): Promise<void> {
    return await test.step(`Wait until is in section "${sectionName}"`, async () => {
      await expect(this.currentSectionName).toContainText(sectionName)
    })
  }
}
