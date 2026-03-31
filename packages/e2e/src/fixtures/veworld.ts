import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import {
  chromium,
  expect,
  test as base,
  type BrowserContext,
  type Frame,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test"

import { baseUrl, headless, localNetworkName, localNodeUrl, walletMnemonic, walletPassword } from "../config"
import { ensureVeWorldExtensionPath } from "../utils/extension"

type VeWorldFixtures = {
  walletContext: BrowserContext
  extensionId: string
  extensionPage: Page
  appPage: Page
}

type VeWorldApprovalTarget = Frame | Page

const waitUntilVisible = async (locator: Locator, timeout = 1000) => {
  try {
    await locator.waitFor({ state: "visible", timeout })
    return true
  } catch {
    return false
  }
}

const getConnectButton = (page: Page) => page.getByRole("button", { name: /^login$/i }).first()

const getVisibleLocator = async (locators: Locator[], timeout = 500) => {
  for (const locator of locators) {
    if (await waitUntilVisible(locator, timeout)) {
      return locator
    }
  }

  return null
}

const getOnboardingPasswordLocators = (page: Page) => [
  page.getByPlaceholder(/write your password/i),
  page.getByLabel(/^password$/i),
  page.locator("#passwordInput"),
]

const getOnboardingConfirmPasswordLocators = (page: Page) => [
  page.getByPlaceholder(/write password again/i),
  page.getByLabel(/^repeat password$/i),
  page.locator("#confirmPasswordInput"),
]

const getOnboardingPasswordSubmitLocators = (page: Page) => [
  page.locator("#submitPasswordButton"),
  page.locator("button[type='submit']").last(),
  page.getByRole("button", { name: /create wallet|continue|next/i }),
]

const getRecoveryPhraseLocators = (page: Page) => [
  page.locator("[role='goToImportLocalWalletMnemonic']"),
  page.getByRole("button", { name: /^recovery phrase$/i }),
  page.getByText(/^recovery phrase$/i),
]

const getConnectionApproveLocators = (target: VeWorldApprovalTarget) => [
  target.locator("#approve-app-request-btn"),
  target.getByRole("button", { name: /^approve$/i }),
]

const getConnectionConfirmLocators = (target: VeWorldApprovalTarget) => [
  target.locator("#signApproveButton"),
  target.getByRole("button", { name: /sign|confirm/i }),
]

const getConnectionPasswordLocators = (target: VeWorldApprovalTarget) => [
  target.locator("#enterPasswordInput"),
  target.getByTestId("password-input"),
  target.getByPlaceholder(/insert password/i),
  target.getByPlaceholder(/password/i),
  target.getByLabel(/^password$/i),
  target.locator("input[type='password']").first(),
  target.locator("input").first(),
  target.locator("input:visible").first(),
  target.locator("input:visible").last(),
]

const getConnectionPasswordSubmitLocators = (target: VeWorldApprovalTarget) => [
  target.getByTestId("submit-password"),
  target.getByTestId("unlock-button"),
  target.getByRole("button", { name: /^unlock$/i }),
  target.locator("button[type='submit']").last(),
  target.getByRole("button", { name: /submit|continue|unlock|confirm|approve/i }),
  target.locator("button:visible").last(),
]

const getConnectionStateLocators = (target: VeWorldApprovalTarget) => [
  target.getByText(/external app connection/i),
  target.getByText(/welcome back to veworld/i),
]

const getWalletState = async (page: Page) => {
  const passwordInput = await getVisibleLocator(getOnboardingPasswordLocators(page), 250)
  const confirmPasswordInput = await getVisibleLocator(getOnboardingConfirmPasswordLocators(page), 250)

  if (
    (await waitUntilVisible(page.getByTestId("continueOnboardingButton"), 250)) ||
    (passwordInput && confirmPasswordInput)
  ) {
    return "onboarding"
  }

  if (await waitUntilVisible(page.getByTestId("password-input"), 250)) {
    return "unlock"
  }

  if (await waitUntilVisible(page.getByTestId("accountFiatBalance"), 250)) {
    return "dashboard"
  }

  return null
}

const fillMnemonic = async (page: Page) => {
  const words = walletMnemonic.trim().split(/\s+/)

  for (const [index, word] of words.entries()) {
    await page.getByTestId(`mnemonic-word-${index}`).fill(word)
  }
}

const completeOnboarding = async (page: Page) => {
  let passwordInput = await getVisibleLocator(getOnboardingPasswordLocators(page))
  let confirmPasswordInput = await getVisibleLocator(getOnboardingConfirmPasswordLocators(page))

  if (!passwordInput || !confirmPasswordInput) {
    await expect(page.getByTestId("continueOnboardingButton")).toBeVisible()
    await page.getByTestId("continueOnboardingButton").click()
    await page.locator("#skipButton").click()

    passwordInput = await getVisibleLocator(getOnboardingPasswordLocators(page), 5_000)
    confirmPasswordInput = await getVisibleLocator(getOnboardingConfirmPasswordLocators(page), 5_000)
  }

  if (!passwordInput || !confirmPasswordInput) {
    throw new Error("VeWorld password setup fields not found")
  }

  await passwordInput.fill(walletPassword)
  await confirmPasswordInput.fill(walletPassword)

  const submitPasswordButton = await getVisibleLocator(getOnboardingPasswordSubmitLocators(page), 1_000)
  if (submitPasswordButton) {
    await submitPasswordButton.click()
  } else {
    await confirmPasswordInput.press("Enter")
  }

  const directRecoveryPhraseButton = await getVisibleLocator(getRecoveryPhraseLocators(page), 5_000)
  if (directRecoveryPhraseButton) {
    await directRecoveryPhraseButton.click()
  } else {
    await expect(page.locator("[role='goToImportWallet']")).toBeVisible()
    await page.locator("[role='goToImportWallet']").click()
    await page.locator("[role='goToImportLocalWallet']").click()

    const recoveryPhraseButton = await getVisibleLocator(getRecoveryPhraseLocators(page), 5_000)
    if (!recoveryPhraseButton) {
      throw new Error("VeWorld recovery phrase option not found")
    }

    await recoveryPhraseButton.click()
  }

  await fillMnemonic(page)
  await page.getByTestId("importLocalWalletMnemonicButton").click()

  const continueAfterImport = await getVisibleLocator(
    [page.locator("#goToHomepage"), page.getByRole("button", { name: /^continue$/i })],
    15_000,
  )
  if (!continueAfterImport) {
    throw new Error("VeWorld import success continue button not found")
  }

  await continueAfterImport.click()

  await expect(page.getByTestId("accountFiatBalance")).toBeVisible()
}

const unlockWallet = async (page: Page) => {
  await expect(page.getByTestId("password-input")).toBeVisible()
  await page.getByTestId("password-input").fill(walletPassword)
  await page.getByTestId("unlock-button").click()
  await expect(page.getByTestId("accountFiatBalance")).toBeVisible()
}

const ensureWalletReady = async (page: Page) => {
  await page.bringToFront()

  for (let attempt = 0; attempt < 20; attempt++) {
    const state = await getWalletState(page)

    if (state === "onboarding") {
      await completeOnboarding(page)
      return
    }

    if (state === "unlock") {
      await unlockWallet(page)
      return
    }

    if (state === "dashboard") {
      return
    }

    await page.waitForTimeout(500)
  }

  throw new Error("VeWorld extension is in an unknown state")
}

const getVeWorldApprovalTarget = async (
  page: Page,
  extensionPage?: Page,
  attempts = 40,
): Promise<VeWorldApprovalTarget> => {
  if (process.env.B3TR_E2E_PAUSE_BEFORE_FIXTURE === "true") {
    console.log("Paused before waiting for #veworld-frame")
    await page.pause()
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (extensionPage && !extensionPage.isClosed()) {
      const extensionPageAction =
        (await getVisibleLocator(getConnectionApproveLocators(extensionPage), 250)) ??
        (await getVisibleLocator(getConnectionConfirmLocators(extensionPage), 250)) ??
        (await getVisibleLocator(getConnectionPasswordLocators(extensionPage), 250))

      if (extensionPageAction || (await getVisibleLocator(getConnectionStateLocators(extensionPage), 250))) {
        return extensionPage
      }
    }

    const frameHandle = await page.locator("#veworld-frame").elementHandle()
    const frame = await frameHandle?.contentFrame()

    if (frame) {
      const frameAction =
        (await getVisibleLocator(getConnectionApproveLocators(frame), 250)) ??
        (await getVisibleLocator(getConnectionConfirmLocators(frame), 250)) ??
        (await getVisibleLocator(getConnectionPasswordLocators(frame), 250))

      if (frameAction) {
        return frame
      }
    }

    const extensionPages = page
      .context()
      .pages()
      .filter(contextPage => contextPage.url().startsWith("chrome-extension://"))
      .reverse()

    for (const extensionPage of extensionPages) {
      const pageAction =
        (await getVisibleLocator(getConnectionApproveLocators(extensionPage), 250)) ??
        (await getVisibleLocator(getConnectionConfirmLocators(extensionPage), 250)) ??
        (await getVisibleLocator(getConnectionPasswordLocators(extensionPage), 250))

      if (pageAction || (await getVisibleLocator(getConnectionStateLocators(extensionPage), 250))) {
        return extensionPage
      }
    }

    await page.waitForTimeout(500)
  }

  throw new Error("VeWorld approval UI not found")
}

export const selectVeWorldWallet = async (page: Page) => {
  await expect(page.getByRole("button", { name: /connect with veworld wallet/i })).toBeVisible()
  await page.getByRole("button", { name: /connect with veworld wallet/i }).click()

  const walletOption = page.getByRole("button", { name: /^veworld$/i })
  await expect(walletOption).toBeVisible()
  await walletOption.click({ force: true })
}

export const approveConnection = async (page: Page, extensionPage?: Page, isConnected?: () => boolean) => {
  if (process.env.B3TR_E2E_PAUSE_ON_FRAME_READY === "true") {
    console.log("Paused after resolving VeWorld approval UI")
    await page.pause()
  }

  for (let step = 0; step < 20; step++) {
    if (isConnected?.()) {
      return
    }

    const target = await getVeWorldApprovalTarget(page, extensionPage, step === 0 ? 40 : 10)

    if ("bringToFront" in target) {
      await target.bringToFront()
    }

    const approveButton = await getVisibleLocator(getConnectionApproveLocators(target), step === 0 ? 15_000 : 2_000)
    if (approveButton) {
      await approveButton.click({ force: true })

      if (process.env.B3TR_E2E_PAUSE_AFTER_APPROVE === "true") {
        console.log("Paused after clicking VeWorld approve")
        await page.pause()
      }

      await page.waitForTimeout(500)
      continue
    }

    const confirmButton = await getVisibleLocator(getConnectionConfirmLocators(target), 2_000)
    if (confirmButton) {
      await confirmButton.click({ force: true })
      await page.waitForTimeout(500)
      continue
    }

    const passwordInput = await getVisibleLocator(getConnectionPasswordLocators(target), 2_000)
    if (passwordInput) {
      await passwordInput.fill(walletPassword)

      const passwordSubmitButton = await getVisibleLocator(getConnectionPasswordSubmitLocators(target), 1_000)
      if (passwordSubmitButton) {
        await passwordSubmitButton.click({ force: true })
      } else {
        await passwordInput.press("Enter")
      }

      await page.waitForTimeout(1_000)

      if (isConnected?.()) {
        return
      }

      continue
    }

    if (await waitUntilVisible(page.getByTestId("wallet-connected"), 1_000)) {
      return
    }

    if (isConnected?.()) {
      return
    }

    await page.waitForTimeout(1_000)
  }

  throw new Error("VeWorld approval flow did not complete")
}

export const connectWithVeWorld = async (page: Page, extensionPage?: Page) => {
  let hasAuthenticatedRequest = false
  const handleResponse = (response: Response) => {
    if (response.url().includes("/api/app/creator/submission?walletAddress=") && response.status() === 200) {
      hasAuthenticatedRequest = true
    }
  }

  page.on("response", handleResponse)

  try {
    await expect(getConnectButton(page)).toBeVisible()
    await getConnectButton(page).click()
    await selectVeWorldWallet(page)
    await approveConnection(page, extensionPage, () => hasAuthenticatedRequest)
  } finally {
    page.off("response", handleResponse)
  }
}

const openExtensionPage = async (context: BrowserContext, extensionId: string) => {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/index.html#`, { waitUntil: "domcontentloaded" })
  return page
}

const ensureLocalNetworkConfigured = async (page: Page, extensionId: string) => {
  await page.goto(`chrome-extension://${extensionId}/index.html#/settings/networks/add`, {
    waitUntil: "domcontentloaded",
  })

  await expect(page.getByTestId("networkNameInput")).toBeVisible()
  await page.getByTestId("networkNameInput").fill(localNetworkName)
  await page.getByTestId("networkUrlInput").fill(localNodeUrl)
  await page.getByTestId("submitAddEditNetwork").click()

  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`, {
    waitUntil: "domcontentloaded",
  })
  await expect(page.getByTestId("accountFiatBalance")).toBeVisible()
}

export const test = base.extend<VeWorldFixtures>({
  walletContext: async ({}, use) => {
    const extensionPath = await ensureVeWorldExtensionPath()
    const userDataDir = await mkdtemp(path.join(os.tmpdir(), "b3tr-e2e-profile-"))
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chromium",
      headless,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--window-size=1280,960",
      ],
      viewport: {
        width: 1280,
        height: 960,
      },
    })

    try {
      await use(context)
    } finally {
      await context.close()
      await rm(userDataDir, { recursive: true, force: true })
    }
  },

  extensionId: async ({ walletContext }, use) => {
    let [serviceWorker] = walletContext.serviceWorkers()
    if (!serviceWorker) {
      serviceWorker = await walletContext.waitForEvent("serviceworker")
    }

    const extensionId = new URL(serviceWorker.url()).host
    await use(extensionId)
  },

  extensionPage: async ({ walletContext, extensionId }, use) => {
    const page = await openExtensionPage(walletContext, extensionId)
    await ensureWalletReady(page)
    await ensureLocalNetworkConfigured(page, extensionId)

    try {
      await use(page)
    } finally {
      await page.close()
    }
  },

  appPage: async ({ walletContext, extensionPage }, use) => {
    void extensionPage

    const page = await walletContext.newPage()
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" })

    try {
      await use(page)
    } finally {
      await page.close()
    }
  },
})

export { expect }

export const ensureVeWorldLoggedIn = async (page: Page, extensionPage?: Page) => {
  const isConnected = await page
    .getByTestId("wallet-connected")
    .isVisible()
    .catch(() => false)
  if (!isConnected) {
    let lastError: unknown

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
        await connectWithVeWorld(page, extensionPage)
        lastError = undefined
        break
      } catch (error) {
        lastError = error
      }
    }

    if (lastError) {
      throw lastError
    }
  }

  await expect(page.getByTestId("wallet-connected")).toBeVisible()
}

export const approveVeWorldTransaction = async (page: Page, extensionPage?: Page) => {
  let confirmed = false
  const successModal = page
    .getByTestId("tx-modal-title")
    .filter({ hasText: /transaction completed!/i })
    .waitFor({ state: "visible", timeout: 120_000 })
    .then(() => {
      confirmed = true
    })

  await approveConnection(page, extensionPage, () => confirmed)
  await successModal
  await page.getByRole("button", { name: /^done$/i }).click()
}
