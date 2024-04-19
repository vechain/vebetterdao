import { expect, test, Page, Locator } from "@playwright/test"
import { dragAndDropFile } from "../utils/helpers"
import { AppDetails } from "./types"

/**
 * App edit page model
 */
export class AppEditPage {
  private readonly page: Page
  readonly nameInput: Locator
  readonly descriptionInput: Locator
  readonly projectUrlInput: Locator
  readonly walletAddressInput: Locator
  readonly logoUploadFileBtn: Locator
  readonly bannerUploadFileBtn: Locator
  readonly saveBtn: Locator
  readonly modal: Locator
  readonly backBtn: Locator

  constructor(page: Page) {
    this.page = page

    this.nameInput = this.page.locator("//*[@name='name']")
    this.descriptionInput = this.page.locator("//textarea[@name='description']")
    this.projectUrlInput = this.page.locator("//*[@name='projectUrl']")
    this.walletAddressInput = this.page.locator("//*[@name='receiverAddress']")
    this.logoUploadFileBtn = this.page.locator("(//button[text()='Upload File'])[1]")
    this.bannerUploadFileBtn = this.page.locator("(//button[text()='Upload File'])[2]")
    this.saveBtn = this.page.locator("//button[text()='Save']")
    this.modal = this.page.locator("//*[contains(@id, 'modal')]")
    this.backBtn = this.page.locator("(//button[text()='Apps'])[1]")
  }


  async updateAppDetails(appDetails: AppDetails) {
    await test.step('Update app details', async () => {
      if (appDetails.name)
        await this.nameInput.fill(appDetails.name)

      if (appDetails.description)
        await this.descriptionInput.fill(appDetails.description)

      if (appDetails.projectUrl)
        await this.projectUrlInput.fill(appDetails.projectUrl)

      if (appDetails.walletAddress)
        await this.walletAddressInput.fill(appDetails.walletAddress)

      if (appDetails.logoFilePath) {
        await dragAndDropFile(
          this.page,
          "(//button[text()='Upload File'])[1]",
          appDetails.logoFilePath,
          'logo-updated.png',
          'png'
        )
      }

      if (appDetails.bannerFilePath) {
        await dragAndDropFile(
          this.page,
          "(//button[text()='Upload File'])[2]",
          appDetails.bannerFilePath,
          'banner-updated.png',
          'png'
        )
      }

      await this.saveBtn.click()
      await expect(this.modal).toBeVisible()
      await expect(this.modal).toBeHidden()
    })
  }

  async backToAppsList() {
    return await test.step('Navigate back to Apps list', async () => {
      await this.backBtn.click()
    })
  }
}