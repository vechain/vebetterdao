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
} from "@playwright/test"

import { baseUrl, headless, walletMnemonic, walletPassword } from "../config"
import { ensureVeWorldExtensionPath } from "../utils/extension"

type VeWorldFixtures = {
  walletContext: BrowserContext
  extensionId: string
  extensionPage: Page
  appPage: Page
}

const waitUntilVisible = async (locator: Locator, timeout = 1000) => {
  try {
    await locator.waitFor({ state: "visible", timeout })
    return true
  } catch {
    return false
  }
}

const getConnectButton = (page: Page) => page.getByRole("button", { name: /^login$/i }).first()

const getWalletState = async (page: Page) => {
  if (await waitUntilVisible(page.getByTestId("continueOnboardingButton"), 250)) {
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
  await expect(page.getByTestId("continueOnboardingButton")).toBeVisible()
  await page.getByTestId("continueOnboardingButton").click()
  await page.locator("#skipButton").click()

  await page.locator("#passwordInput").fill(walletPassword)
  await page.locator("#confirmPasswordInput").fill(walletPassword)
  await page.locator("#submitPasswordButton").click()

  await expect(page.locator("[role='goToImportWallet']")).toBeVisible()
  await page.locator("[role='goToImportWallet']").click()
  await page.locator("[role='goToImportLocalWallet']").click()
  await page.locator("[role='goToImportLocalWalletMnemonic']").click()

  await fillMnemonic(page)
  await page.getByTestId("importLocalWalletMnemonicButton").click()
  await page.locator("#goToHomepage").click()

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

const getVeWorldFrame = async (page: Page): Promise<Frame> => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const frameHandle = await page.locator("#veworld-frame").elementHandle()
    const frame = await frameHandle?.contentFrame()

    if (frame) return frame

    await page.waitForTimeout(500)
  }

  throw new Error("VeWorld iframe not found")
}

export const selectVeWorldWallet = async (page: Page) => {
  await expect(page.getByRole("button", { name: /connect with veworld wallet/i })).toBeVisible()
  await page.getByRole("button", { name: /connect with veworld wallet/i }).click()

  const walletOption = page.getByRole("button", { name: /^veworld$/i })
  await expect(walletOption).toBeVisible()
  await walletOption.click({ force: true })
}

export const approveConnection = async (page: Page) => {
  const frame = await getVeWorldFrame(page)

  await expect(frame.locator("#approve-app-request-btn")).toBeVisible()
  await frame.locator("#approve-app-request-btn").click()

  await expect(frame.locator("#signApproveButton")).toBeVisible()
  await frame.locator("#signApproveButton").click()

  await expect(frame.locator("#enterPasswordInput")).toBeVisible()
  await frame.locator("#enterPasswordInput").fill(walletPassword)
  await frame.getByTestId("submit-password").click()
}

export const connectWithVeWorld = async (page: Page) => {
  await expect(getConnectButton(page)).toBeVisible()
  await getConnectButton(page).click()
  await selectVeWorldWallet(page)
  await approveConnection(page)
}

const openExtensionPage = async (context: BrowserContext, extensionId: string) => {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/index.html#`, { waitUntil: "domcontentloaded" })
  return page
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
