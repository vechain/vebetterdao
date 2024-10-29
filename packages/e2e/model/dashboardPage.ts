import { Page } from "playwright"
import { expect, Locator, test } from "@playwright/test"
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"
import BigNumber from "bignumber.js"
import { SwapDialog } from "./swapDialog"
import { BasePage } from "./basePage"
import { expand, trimAddress } from "../utils/strings"

/**
 * Dashboard page model
 */
export class DashboardPage extends BasePage {
  readonly connectWalletButton: Locator
  readonly veWorldOption: Locator
  readonly disconnectOption: Locator
  readonly b3trBalanceText: Locator
  readonly vot3BalanceText: Locator
  readonly swapButton: Locator
  readonly claimRewardsButton: Locator
  readonly votingRewardsAmount: string
  readonly mintNFTButton: Locator

  constructor(page: Page) {
    super(page)

    this.connectWalletButton = this.page.getByTestId("connect-wallet")
    this.veWorldOption = this.page.locator("vdk-source-card", { hasText: "VeWorld" })
    this.disconnectOption = this.page.getByRole("button", { name: "Disconnect" })
    this.b3trBalanceText = this.page.getByTestId("B3TR-balance")
    this.vot3BalanceText = this.page.getByTestId("VOT3-balance")
    this.swapButton = this.page.getByTestId("convert-tokens-button")
    this.claimRewardsButton = this.page.locator('xpath=//button[contains(text(), "Claim")]')
    this.votingRewardsAmount = "voting-rewards"
    this.mintNFTButton = this.page.locator('xpath=//button[contains(text(), "Mint now")]')
  }

  /**
   * Connect wallet
   * @returns address of connected wallet
   */
  async connectWallet(accountIndex?: number): Promise<string> {
    return await test.step("Connect Wallet", async () => {
      await this.initVWMock(accountIndex)
      await expect(this.connectWalletButton.first()).toBeVisible()
      await this.connectWalletButton.first().click()
      await this.veWorldOption.first().click()
      const mockAddress = await veWorldMockClient.getSignerAddress(this.page)
      console.log("connected wallet address", mockAddress)
      // await this.reloadWithReconnect(accountIndex)
      await this.page.reload()
      await this.initVWMock(accountIndex) // needs to be re-inited after page reload
      await expect(this.connectWalletButton.first()).not.toBeVisible()
      await expect(this.page.getByTestId("wallet-address")).toHaveText(trimAddress(mockAddress))
      return mockAddress
    })
  }

  /**
   * Disconnect wallet
   * @param address address of connected wallet
   */
  async disconnectWallet(address: string) {
    await test.step("Disconnect Wallet", async () => {
      await this.page.locator(`[data-cy='address-icon-${address}']`).click()
      await this.disconnectOption.first().click()
      await this.page.reload()
      await expect(this.connectWalletButton.first()).toBeVisible()
    })
  }

  /**
   * Get B3TR balance of connected wallet
   * @returns B3TR balance
   */
  async getB3TRBalance(): Promise<BigNumber> {
    return await test.step("Getting B3TR balance", async () => {
      await this.b3trBalanceText.first().scrollIntoViewIfNeeded()
      const text = await this.b3trBalanceText.first().textContent()
      const textBalance =
        text ??
        (() => {
          throw new Error("B3TR balance not found")
        })()
      const fullTextBalance = expand(textBalance)
      console.log(`B3TR balance full text: ${fullTextBalance}`)
      const balance = new BigNumber(fullTextBalance)
      console.log(`B3TR balance: ${balance}`)
      return balance
    })
  }

  /**
   * Expect B3TR balance to be equal to expected balance
   * @param expectedBalance expected B3TR balance
   */
  async expectB3TRBalance(expectedBalance: string) {
    await test.step(`Expect B3TR balance = ${expectedBalance}`, async () => {
      await expect(this.b3trBalanceText.first()).toHaveText(expectedBalance)
    })
  }

  /**
   * Expect B3TR balance to be greater than expected balance
   * @param expectedBalance expected B3TR balance
   */
  async expectB3TRBalanceGreaterThan(expectedBalance: number) {
    await test.step(`Expect B3TR balance to be greater than ${expectedBalance}`, async () => {
      await expect(async () => {
        const balance = await this.getB3TRBalance()
        const expected = new BigNumber(expectedBalance)
        expect(balance.isGreaterThan(expected)).toBeTruthy()
      }).toPass()
    })
  }

  /**
   * Get VOT3 balance of connected wallet
   * @returns VOT3 balance
   */
  async getVOT3Balance(): Promise<BigNumber> {
    return await test.step("Getting VOT3 balance", async () => {
      const text = await this.vot3BalanceText.first().textContent()
      const textBalance =
        text ??
        (() => {
          throw new Error("VOT3 balance not found")
        })()
      const fullTextBalance = textBalance.replace("K", "000")
      return new BigNumber(fullTextBalance)
    })
  }

  /**
   * Expect VOT3 balance to be equal to expected balance
   * @param expectedBalance expected VOT3 balance
   */
  async expectVOT3Balance(expectedBalance: string) {
    await test.step(`Expect VOT3 balance = ${expectedBalance}`, async () => {
      await expect(this.vot3BalanceText.first()).toHaveText(expectedBalance)
    })
  }

  /**
   * Click on swap button and wait for dialog to be visible
   */
  async clickSwapButton(): Promise<SwapDialog> {
    return await test.step("Click Swap button", async () => {
      await this.page.getByRole("button", { name: "Convert tokens" }).first().click()
      await expect(this.swapButton).toBeVisible()
      return new SwapDialog(this.page)
    })
  }

  /**
   * Click claim rewards button
   */
  async clickClaimRewards() {
    await test.step("Click Claim Rewards", async () => {
      await expect(this.claimRewardsButton.first()).toBeEnabled()
      await this.claimRewardsButton.first().click()
    })
  }

  /**
   * Click on Mint Now
   */
  async mintNFT() {
    await test.step("Click on Mint Now to mint NFT", async () => {
      await expect(this.mintNFTButton.first()).toBeEnabled()
      await this.mintNFTButton.first().click()
    })
  }

  /**
   * Assert that NFT is displayed
   * @param nftName Name of NFT e.g. GM Earth
   */
  async expectNFTToBeDisplayed(nftName: string) {
    await test.step(`Expect NFT ${nftName} to be displayed`, async () => {
      const xpath = `xpath=//p[contains(text(),"${nftName} #")]`
      await expect(this.page.locator(xpath).first()).toBeVisible()
    })
  }

  async initVWMock(accountIndex: number) {
    await veWorldMockClient.load(this.page)
    await veWorldMockClient.installMock(this.page)
    await veWorldMockClient.setOptions(this.page, { gasMultiplier: 0.5 })
    if (accountIndex) await veWorldMockClient.setConfig(this.page, { accountIndex: accountIndex })
  }
}
