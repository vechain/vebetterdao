import { test } from '@playwright/test';
import { FIXED_ACCOUNT1, HOMEPAGE } from '../utils/constants';
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils from '../utils/blockchain';

test.describe('Connect Wallet', () => {

  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.installForSolo(page, HOMEPAGE)
    await veWorldMockClient.setSignerAccIndex(page, FIXED_ACCOUNT1)
  })

  test('User can connect wallet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.connectWallet()
  });

  test('User can disconnect wallet', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.disconnectWallet()
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