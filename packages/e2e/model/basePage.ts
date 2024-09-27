import { Page } from "@playwright/test"
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"

export class BasePage {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Reloads the page, then reconnects VeWorld session.
   * VeWorld mock session is lost after page reload. So, use this time every time you reload the page.
   */
  async reloadWithReconnect(accountIndex?: number) {
    await this.page.reload()
    await veWorldMockClient.load(this.page)
    await veWorldMockClient.installMock(this.page)
    await veWorldMockClient.setOptions(this.page, { gasMultiplier: 0.5 })
    if (accountIndex) await veWorldMockClient.setConfig(this.page, { accountIndex: accountIndex })
  }
}
