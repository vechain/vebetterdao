import { test } from "@playwright/test"
import { HOMEPAGE } from "../utils/constants"
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"
import { DashboardPage } from "../model/dashboardPage"
import blockchainUtils from "../utils/blockchain"
import BigNumber from "bignumber.js"
import { SwapConfirmationDialog } from "../model/swapConfirmationDialog"
import { compact } from "../utils/strings"

test.describe("Swap Tokens", () => {
  test.describe.configure({ timeout: 60 * 1000 })

  let confirm: SwapConfirmationDialog
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    confirm = new SwapConfirmationDialog(page)
    dashboardPage = new DashboardPage(page)

    await veWorldMockClient.load(page)
    await page.goto(HOMEPAGE)
    await veWorldMockClient.installMock(page)
    await veWorldMockClient.setOptions(page, { gasMultiplier: 0.5 })
  })

  test.afterEach(async ({ page }) => {
    const lastTxId = await veWorldMockClient.getSenderTxId(page)
    console.log(`Last tx id: ${lastTxId}`)
  })

  test("User can swap B3TR to VOT3", async ({ page }) => {
    const amountToSwap = 1
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    const accAddress = blockchainUtils.getAccountAddress(accountIndex)
    await veWorldMockClient.setConfig(page, { accountIndex: accountIndex })
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
    await dashboardPage.connectWallet(accountIndex)
    // get before swap balances from contract
    const bt3rBalanceBefore = await blockchainUtils.getB3TRBalance(accAddress)
    const vot3BalanceBefore = await blockchainUtils.getVOT3Balance(accAddress)
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.swap(amountToSwap, "B3TR", "VOT3")
    await confirm.expectDialogSuccess()
    await confirm.closeDialog()
    // check balances in ui
    const expectedB3TRBalance = compact(Object(bt3rBalanceBefore.minus(amountToSwap)).valueOf())
    const expectedVOT3Balance = compact(Object(vot3BalanceBefore.plus(amountToSwap)).valueOf())
    await dashboardPage.expectB3TRBalance(expectedB3TRBalance)
    await dashboardPage.expectVOT3Balance(expectedVOT3Balance)
  })

  test("User can swap VOT3 to B3TR", async ({ page }) => {
    const amountToSwap = 1
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    const accAddress = blockchainUtils.getAccountAddress(accountIndex)
    await veWorldMockClient.setConfig(page, { accountIndex: accountIndex })
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
    await dashboardPage.connectWallet(accountIndex)
    // get before swap balances from contract
    const bt3rBalanceBefore = await blockchainUtils.getB3TRBalance(accAddress)
    const vot3BalanceBefore = await blockchainUtils.getVOT3Balance(accAddress)
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.swap(amountToSwap, "VOT3", "B3TR")
    await confirm.expectDialogSuccess()
    await confirm.closeDialog()
    // check balances in ui
    const expectedB3TRBalance = compact(Object(bt3rBalanceBefore.plus(amountToSwap)).valueOf())
    const expectedVOT3Balance = compact(Object(vot3BalanceBefore.minus(amountToSwap)).valueOf())
    await dashboardPage.expectB3TRBalance(expectedB3TRBalance)
    await dashboardPage.expectVOT3Balance(expectedVOT3Balance)
  })

  test("User gets error if swap tx is reverted", async ({ page }) => {
    // setup rnd account
    const accountIndex = blockchainUtils.getRndAccountIndex()
    await veWorldMockClient.setConfig(page, { accountIndex: accountIndex })
    await blockchainUtils.fundAccount(accountIndex)
    // connect wallet
    await dashboardPage.connectWallet(accountIndex)
    // set tx to revert
    await veWorldMockClient.setOptions(page, { mockTransaction: "revert" })
    // do the swap via ui
    const swapDialog = await dashboardPage.clickSwapButton()
    await swapDialog.swap(new BigNumber(1), "B3TR", "VOT3")
    await confirm.expectDialogFailed()
  })
})
