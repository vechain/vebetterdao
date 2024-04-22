import { test, TestInfo } from '@playwright/test';
import { HOMEPAGE } from '../utils/constants';
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils, { Account } from '../utils/blockchain';
import BigNumber from 'bignumber.js';
import { SwapConfirmationDialog } from '../model/swapConfirmationDialog';
import { CommonActions } from "../model/commonActions"
import { SwapDialog } from "../model/swapDialog"
import * as constants from '../utils/constants'
import { trimmedAddress } from "../utils/helpers"
import uniqueRandom from "../utils/unique-random"

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
    await swapDialog.enterSendAmount(BigNumber(amountToSwap))
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
    await swapDialog.enterSendAmount(BigNumber(amountToSwap))
    await swapDialog.clickSwap()
    const confirm = new SwapConfirmationDialog(page)
    await confirm.expectSwapCompleted()
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
    await swapDialog.enterSendAmount(new BigNumber(1))
    await swapDialog.clickSwap()
    const confirm = new SwapConfirmationDialog(page)
    await confirm.expectSwapFailed()
  });

  // the following `describe` covers a single test case
  test.describe('max swappable amount', () => {
    test.describe.configure({ mode: 'serial' });

    let accountA: Account
    let accountB: Account

    test.beforeAll(async () => {
      const randomAccGenerator = uniqueRandom(constants.DYNAMIC_ACCOUNT_MIN, constants.DYNAMIC_ACCOUNT_MAX)
      accountA = blockchainUtils.account(randomAccGenerator.next().value)
      accountB = blockchainUtils.account(randomAccGenerator.next().value)

      // 1. fund accounts
      await test.step(`[bcUtils] Fund ${accountA.address} and ${accountB.address} with 5 B3TR and 5k VTHO each`, async () => {
        await blockchainUtils.fundB3TR(accountA.address, BigNumber(5))
        await blockchainUtils.fundVTHO(accountA.address, BigNumber(5000))
        await blockchainUtils.fundB3TR(accountB.address, BigNumber(5))
        await blockchainUtils.fundVTHO(accountB.address, BigNumber(5000))
      })

      // 2. [acc A]: swap 2 B3TR for VOT3
      await test.step(`[bcUtils] Swap 2 B3TR for VOT3 on ${accountA.address}`, async () => {
        await blockchainUtils.swapB3TRForVOT3(accountA.pk, accountA.address, BigNumber(2))
      })

      // 3. [acc B]: swap 2 B3TR for VOT3
      await test.step(`[bcUtils] Swap 2 B3TR for VOT3 on ${accountB.address}`, async () => {
        await blockchainUtils.swapB3TRForVOT3(accountB.pk, accountB.address, BigNumber(2))
      })

      // 4. [acc A]: transfer 2 VOT3 to acc B
      await test.step(`[bcUtils] Send 2 VOT3 from "${trimmedAddress(accountA.address)}" to "${trimmedAddress(accountB.address)}"`, async () => {
        await blockchainUtils.doERC20Transfer({
          contract: constants.VOT3_CONTRACT_ADDRESS,
          amount: BigNumber(2),
          sender: accountA,
          receiver: accountB.address
        })
      })
    })

    test("Cannot swap VOT3 sent from another account for B3TR", async ({ page }) => {
      const actions = new CommonActions(page)
      const dashboardPage = new DashboardPage(page)
      const swapDialog = new SwapDialog(page)

      await actions.loginAs(accountB.index)
      // 5. [acc B]: swap 2 VOT3 for B3TR
      await actions.swap({
        sendToken: 'VOT3',
        receiveToken: 'B3TR',
        sendAmount: BigNumber(2)
      })
      // 6. [acc B]: expect to have 0 VOT3 max balance
      await dashboardPage.clickSwapButton()
      await swapDialog.expectMaxSwappableAmount('VOT3', '0')
    })

    test('max swappable amount, pt.2', async ({ page }) => {
      const actions = new CommonActions(page)
      const dashboardPage = new DashboardPage(page)
      const swapDialog = new SwapDialog(page)

      // 7. [acc B]: transfer 2 vot3 back to acc A
      await test.step(`[bcUtils] Send 2 VOT3 from "${trimmedAddress(accountA.address)}" to "${trimmedAddress(accountB.address)}"`, async () => {
        await blockchainUtils.doERC20Transfer({
          contract: constants.VOT3_CONTRACT_ADDRESS,
          amount: BigNumber(2),
          sender: accountA,
          receiver: accountB.address
        })
      })
      // 8. [acc A]: max balance of vot3 at swap is 2
e .      await actions.loginAs(accountA.index)
      await dashboardPage.clickSwapButton()
      await swapDialog.expectMaxSwappableAmount('VOT3', '2')
      await swapDialog.closeSwapModal()
      await dashboardPage.disconnectWallet()
    })
  })
})