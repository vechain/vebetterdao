import { test } from '@playwright/test';
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils from '../utils/blockchain';
import { HOMEPAGE } from '../utils/constants';

test.describe('Connect Wallet', () => {

  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.load(page)
    await page.goto(HOMEPAGE)
    await veWorldMockClient.installMock(page)
  })

  test('User can connect wallet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.connectWallet()
  });

  test('User can disconnect wallet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const address = await dashboardPage.connectWallet()
    await dashboardPage.disconnectWallet(address)
  });

  test('User can see B3TR balance after connecting wallet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const address = await dashboardPage.connectWallet()
    const expectedBalance = await blockchainUtils.getB3TRBalance(address)
    await dashboardPage.expectB3TRBalance(expectedBalance)
  })

  test('User can see VOT3 balance after connecting wallet', async ({ page }) => {
    //TODO : Account will need some VOT3 tokens to test this
    const dashboardPage = new DashboardPage(page);
    const address = await dashboardPage.connectWallet()
    const expectedBalance = await blockchainUtils.getVOT3Balance(address)
    await dashboardPage.expectVOT3Balance(expectedBalance)
  })

});