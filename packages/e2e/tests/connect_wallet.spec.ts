import { test } from "@playwright/test"
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"
import { DashboardPage } from "../model/dashboardPage"
import blockchainUtils from "../utils/blockchain"
import { HOMEPAGE } from "../utils/constants"
import { compact } from "../utils/strings"

test.describe("Connect Wallet", () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)

    await veWorldMockClient.load(page)
    await page.goto(HOMEPAGE)
    await veWorldMockClient.installMock(page)
  })

  test("User can connect wallet", async () => {
    await dashboardPage.connectWallet()
  })

  test("User can disconnect wallet", async () => {
    const address = await dashboardPage.connectWallet()
    await dashboardPage.disconnectWallet(address)
  })

  test("User can see B3TR balance after connecting wallet", async () => {
    const address = await dashboardPage.connectWallet()
    const expectedBalance = Object(await blockchainUtils.getB3TRBalance(address)).valueOf()
    await dashboardPage.expectB3TRBalance(compact(expectedBalance))
  })

  test("User can see VOT3 balance after connecting wallet", async () => {
    //TODO : Account will need some VOT3 tokens to test this
    const address = await dashboardPage.connectWallet()
    const expectedBalance = Object(await blockchainUtils.getVOT3Balance(address)).valueOf()
    await dashboardPage.expectVOT3Balance(compact(expectedBalance))
  })
})
