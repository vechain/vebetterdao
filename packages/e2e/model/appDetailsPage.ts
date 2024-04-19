import { expect, test, Page, Locator } from "@playwright/test"
import { dragAndDropFile } from "../utils/helpers"
import { AppEditPage } from "./appEditPAge"

/**
 * App details page model
 */
export class AppDetailsPage {
  private readonly page: Page
  readonly editAppPageBtn: Locator


  constructor(page: Page) {
    this.page = page

    this.editAppPageBtn = this.page.locator("//*[contains(text(), 'Edit App page')]")

  }

  /**
   * Opens the app edit page
   * @returns 
   */
  async openEditDetailsPage(): Promise<AppEditPage {
    return await test.step('Open edit app details page', async () => {
      await this.editAppPageBtn.click()
      return new AppEditPage(this.page)
    })
  }

}