import { test, expect } from '@playwright/test';
import { HOMEPAGE, THOR_URL } from '../utils/constants';
import { screenshotOnFailure } from '../utils/screenshot';
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils from '../utils/blockchain';
import BigNumber from 'bignumber.js';
import { SwapConfirmationDialog } from '../model/swapConfirmationDialog';

test.describe('Swap Tokens', () => {

  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.load(page);
    await page.goto(HOMEPAGE);
    await veWorldMockClient.install(page)
    await veWorldMockClient.setThorUrl(page, THOR_URL)
  })

  test.afterEach(screenshotOnFailure);

  test('User can swap B3TR to VOT3', async ({ page }) => {
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    const accAddress = blockchainUtils.getAccountAddress(accountIndex)
    await veWorldMockClient.setSignerAccIndex(page, accountIndex)
    await blockchainUtils.fundAccount(accountIndex)
    // connect walled
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.connectWallet()
    // get before swap balances from contract
    const bt3rBalanceBefore = await blockchainUtils.getB3TRBalance(accAddress)
    const vot3BalanceBefore = await blockchainUtils.getVOT3Balance(accAddress)
    const amountToSwap = 1
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.enterFirstAmount(new BigNumber(amountToSwap))
    await swapDialog.clickSwap()
    const confirm = new SwapConfirmationDialog(page)
    await confirm.expectSwapCompleted()
    await confirm.closeDialog()
    const expectedB3TRBalance = bt3rBalanceBefore.minus(amountToSwap)
    const expectedVOT3Balance = vot3BalanceBefore.plus(amountToSwap)
    // check balances in ui
    await dashboardPage.expectB3TRBalance(expectedB3TRBalance)
    await dashboardPage.expectVOT3Balance(expectedVOT3Balance)
  });


})