import { expect, test } from "@playwright/test"
import { APP_ADMIN_ACCOUNTS, appNames, HOMEPAGE } from "../utils/constants"
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from "../model/dashboardPage"
import { AppDetailsPage } from "../model/appDetailsPage"

test.describe(`Edit app details`, () => {

  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.installForSolo(page, HOMEPAGE)
    await veWorldMockClient.setSignerAccIndex(page, APP_ADMIN_ACCOUNTS['Mugshot'])
  })

  test('Can edit app name, description and project URL', async ({ page }) => {
    const dashboardPage: DashboardPage = new DashboardPage(page)
    await dashboardPage.connectWallet()
    const appDetailsPage = await dashboardPage.openAppDetails('Mugshot')
    const appEditPage = await appDetailsPage.openEditDetailsPage()
    await appEditPage.updateAppDetails({
      name: "Mugshot upd",
      description: "lorem ipsum dolor sit amet",
      projectUrl: "https://www.vechain.org",
      // logoFilePath: path.join(__dirname, '../assets/logo-updated.png'),
      // bannerFilePath: path.join(__dirname, '../assets/banner-updated.png'),
    })
    // TODO: resolve an issue with NEXT_PUBLIC_NFT_STORAGE_KEY to complete the test
  })
})

for (const appName of appNames) {
  test.describe(`[${appName} Admin] App edit access is correct`, () => {
    test.beforeEach(async ({ page }) => {
      const dashboardPage: DashboardPage = new DashboardPage(page);
      await veWorldMockClient.installForSolo(page, HOMEPAGE)
      await veWorldMockClient.setSignerAccIndex(page, APP_ADMIN_ACCOUNTS[appName])
      await dashboardPage.connectWallet()
    })

    // "appName" -> current user is an admin of this app
    // "app" -> an app against which access rights of a current user are verified
    for (let app of appNames) {
      test(`Can${app == appName ? '' : 'not'} edit "${app}" details while logged in as "${appName}" Admin`, async ({ page }) => {
        const dashboardPage: DashboardPage = new DashboardPage(page);
        const appDetailsPage: AppDetailsPage = new AppDetailsPage(page);

        await dashboardPage.openAppDetails(app)
        app == appName
          ? await expect(appDetailsPage.editAppPageBtn).toBeVisible()
          : await expect(appDetailsPage.editAppPageBtn).toBeHidden()
        await appDetailsPage.backToAppsList()
      })
    }
  })
}