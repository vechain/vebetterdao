import { Page } from "playwright"
import { test } from "@playwright/test"
import { DashboardPage } from "./dashboardPage"
import { SwapConfirmationDialog } from "./swapConfirmationDialog"
import { SwapDialog } from "./swapDialog"
import { HOMEPAGE } from "../utils/constants"
import veWorldMockClient from '../utils/veworld-mock-client';
import BigNumber from "bignumber.js"
import blockchainUtils from "../utils/blockchain"
import { BaseDialog } from "./baseDialog"

export class CommonActions {
  private readonly page: Page
  private readonly dashboardPage: DashboardPage
  private readonly swapConfirmationDialog: SwapConfirmationDialog
  private readonly swapDialog: SwapDialog

  constructor(page: Page) {
    this.page = page

    this.dashboardPage = new DashboardPage(this.page)
    this.swapConfirmationDialog = new SwapConfirmationDialog(this.page)
    this.swapDialog = new SwapDialog(this.page)
  }

  /**
   * Logs in and returns an account address of an active user
   * @param accountIndex
   */
  async loginAs(accountIndex: number): Promise<string> {
    const address = blockchainUtils.getAccountAddress(accountIndex)
    return await test.step(`Login; index: "${accountIndex}", address: "${address}"`, async (): Promise<string> => {
      await veWorldMockClient.installForSolo(this.page, HOMEPAGE)
      await veWorldMockClient.setSignerAccIndex(this.page, accountIndex)
      return await this.dashboardPage.connectWallet()
    })
  }

  async swap(args: SwapArgs){
    await test.step(`Swap ${args.max ? "max available amount of" : args.sendAmount} ${args.sendToken} for ${args.receiveToken}`, async () => {
      await this.dashboardPage.clickSwapButton()
      await this.swapDialog.setSendToken(args.sendToken)
      await this.swapDialog.setSendAmount({ token: args.sendToken, max: args.max, amount: args.sendAmount })
      await this.swapDialog.clickSwap()
      await new BaseDialog(this.page, 'Swap Completed!').expectDialogSuccess()
      await this.swapConfirmationDialog.closeDialog()
    })
  }

  // await this.dashboardPage.disconnectWallet(address)
}

export type Token = 'B3TR' | 'VOT3'

/**
 * address {string} - wallet address on which the swap is performed; required to verify if the swap was successful
 */
export interface SwapArgs {
  sendToken: Token
  receiveToken: Token
  sendAmount?: BigNumber
  max?: boolean
}