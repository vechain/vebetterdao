import { test, TestInfo } from '@playwright/test';
import { HOMEPAGE } from '../utils/constants';
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils from '../utils/blockchain';
import BigNumber from 'bignumber.js';
import { SwapConfirmationDialog } from '../model/swapConfirmationDialog';

test.describe('Swap Tokens', () => {

  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.installForSolo(page, HOMEPAGE)
  })

  test.afterEach(async ({ page }, testInfo: TestInfo) => {
    const lastTxId = await veWorldMockClient.getTxId(page)
    console.log(`Last tx id: ${lastTxId}`)
  })

  test('User can swap B3TR to VOT3', async ({ page }) => {
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    const accAddress = blockchainUtils.getAccountAddress(accountIndex)
    await veWorldMockClient.setSignerAccIndex(page, accountIndex)
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
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
    await confirm.expectDialogSuccess()
    await confirm.closeDialog()
    const expectedB3TRBalance = bt3rBalanceBefore.minus(amountToSwap)
    const expectedVOT3Balance = vot3BalanceBefore.plus(amountToSwap)
    // check balances in ui
    await dashboardPage.expectB3TRBalance(expectedB3TRBalance)
    await dashboardPage.expectVOT3Balance(expectedVOT3Balance)
  });

  test('User can swap VOT3 to B3TR', async ({ page }) => {
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    const accAddress = blockchainUtils.getAccountAddress(accountIndex)
    await veWorldMockClient.setSignerAccIndex(page, accountIndex)
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.connectWallet()
    // get before swap balances from contract
    const bt3rBalanceBefore = await blockchainUtils.getB3TRBalance(accAddress)
    const vot3BalanceBefore = await blockchainUtils.getVOT3Balance(accAddress)
    const amountToSwap = 1
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.clickSwitchTokens()
    await swapDialog.enterFirstAmount(new BigNumber(amountToSwap))
    await swapDialog.clickSwap()
    const confirm = new SwapConfirmationDialog(page)
    await confirm.expectDialogSuccess()
    await confirm.closeDialog()
    const expectedB3TRBalance = bt3rBalanceBefore.plus(amountToSwap)
    const expectedVOT3Balance = vot3BalanceBefore.minus(amountToSwap)
    // check balances in ui
    await dashboardPage.expectB3TRBalance(expectedB3TRBalance)
    await dashboardPage.expectVOT3Balance(expectedVOT3Balance)
  });

  test('User gets error if swap tx is reverted', async ({ page }) => {
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    await veWorldMockClient.setSignerAccIndex(page, accountIndex)
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.connectWallet()
    // set tx to revert
    await veWorldMockClient.setTxError(page, true)
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.enterFirstAmount(new BigNumber(1))
    await swapDialog.clickSwap()
    const confirm = new SwapConfirmationDialog(page)
    await confirm.expectDialogFailed()
  });


})