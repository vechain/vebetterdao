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

import {
  baseUrl,
  headless,
  localNetworkName,
  localNodeUrl,
  veworldAfterApproveMs,
  veworldAfterConfirmMs,
  veworldAfterPasswordMs,
  veworldIdleBetweenStepsMs,
  veworldTargetPollMs,
  walletMnemonic,
  walletPassword,
} from "../config"
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

/**
 * Polls all locators in parallel and returns the first one currently visible.
 * Use this instead of `getVisibleLocator` when waits should share a single budget —
 * the sequential variant multiplies `timeout` by `locators.length`, wasting seconds
 * when only one candidate can appear (e.g. `#goToHomepage` vs "Continue" on the
 * "Wallet imported!" screen).
 */
const findFirstVisible = async (locators: Locator[], totalTimeoutMs: number, pollMs = 100) => {
  const deadline = Date.now() + totalTimeoutMs
  while (true) {
    const results = await Promise.all(
      locators.map(locator =>
        locator
          .first()
          .isVisible()
          .catch(() => false),
      ),
    )
    const idx = results.findIndex(Boolean)
    if (idx !== -1) return locators[idx]!.first()
    if (Date.now() >= deadline) return null
    await new Promise(resolve => setTimeout(resolve, pollMs))
  }
}

type ActionKind = "password" | "approve" | "confirm"
type DetectedAction = { kind: ActionKind; locator: Locator }

/**
 * Race password / approve / confirm buttons on the same target — first match wins.
 * Avoids the sequential per-bucket waits that previously stalled the flow when the
 * VeWorld popup only shows one of the three.
 */
const detectActionButton = async (
  target: VeWorldApprovalTarget,
  totalTimeoutMs: number,
  pollMs = 80,
): Promise<DetectedAction | null> => {
  const groups: { kind: ActionKind; locators: Locator[] }[] = [
    { kind: "password", locators: getConnectionPasswordLocators(target) },
    { kind: "approve", locators: getConnectionApproveLocators(target) },
    { kind: "confirm", locators: getConnectionConfirmLocators(target) },
  ]

  const deadline = Date.now() + totalTimeoutMs
  while (true) {
    for (const { kind, locators } of groups) {
      const results = await Promise.all(
        locators.map(locator =>
          locator
            .first()
            .isVisible()
            .catch(() => false),
        ),
      )
      const idx = results.findIndex(Boolean)
      if (idx !== -1) return { kind, locator: locators[idx]!.first() }
    }
    if (Date.now() >= deadline) return null
    await new Promise(resolve => setTimeout(resolve, pollMs))
  }
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
  target.getByTestId("signApproveButton"),
  target.locator("#signApproveButton"),
  target.getByRole("button", { name: /sign|confirm/i }),
]

// Strict locators only — catch-alls like `input.first()` or `input:visible` would match
// unrelated inputs (e.g. the network-selection radios on the extension settings page),
// causing `getVeWorldApprovalTarget` to lock onto the wrong tab and `fill()` to crash.
const getConnectionPasswordLocators = (target: VeWorldApprovalTarget) => [
  target.locator('form#insertPassword input[type="password"]'),
  target.locator("#unlockWalletPassword"),
  target.locator("#enterPasswordInput"),
  target.getByTestId("password-input"),
  target.getByPlaceholder(/insert password/i),
  target.getByPlaceholder(/password/i),
  target.getByLabel(/^password$/i),
  target.locator("input[type='password']").first(),
]

const getConnectionPasswordSubmitLocators = (target: VeWorldApprovalTarget) => [
  target.locator("#submitPasswordButton"),
  target.locator('button[form="confirmPasswordForm"]'),
  target.locator('button[form="unlockWalletForm"]'),
  target.getByTestId("submit-password"),
  target.getByTestId("unlock-button"),
  target.getByRole("button", { name: /^unlock$/i }),
  target.locator("button[type='submit']").last(),
  target.getByRole("button", { name: /submit|continue|unlock|confirm|approve/i }),
  target.locator("button:visible").last(),
]

type WalletState = "onboarding" | "unlock" | "dashboard"

/**
 * Polls all known landmarks in parallel within a single budget. Replaces sequential
 * `getVisibleLocator(..., 250)` checks that wasted ~1.75s per call (3 password locators
 * + 3 confirm-password locators + 3 testIDs, each draining their per-call timeout).
 */
const detectWalletState = async (page: Page, totalTimeoutMs = 15_000): Promise<WalletState | null> => {
  // Race the three landmarks via Playwright's event-driven `waitFor`. This is faster than
  // manual 100ms polling because the browser fires events the moment the element appears
  // (effectively ~16ms latency).
  const wait = (locator: Locator, state: WalletState) =>
    locator
      .first()
      .waitFor({ state: "visible", timeout: totalTimeoutMs })
      .then(() => state)

  return Promise.any([
    wait(page.getByTestId("continueOnboardingButton"), "onboarding"),
    wait(page.getByTestId("password-input"), "unlock"),
    wait(page.getByTestId("accountFiatBalance"), "dashboard"),
  ]).catch(() => null)
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

    passwordInput = await findFirstVisible(getOnboardingPasswordLocators(page), 5_000)
    confirmPasswordInput = await findFirstVisible(getOnboardingConfirmPasswordLocators(page), 5_000)
  }

  if (!passwordInput || !confirmPasswordInput) {
    throw new Error("VeWorld password setup fields not found")
  }

  await passwordInput.fill(walletPassword)
  await confirmPasswordInput.fill(walletPassword)

  const submitPasswordButton = await findFirstVisible(getOnboardingPasswordSubmitLocators(page), 1_000)
  if (submitPasswordButton) {
    await submitPasswordButton.click()
  } else {
    await confirmPasswordInput.press("Enter")
  }

  const directRecoveryPhraseButton = await findFirstVisible(getRecoveryPhraseLocators(page), 5_000)
  if (directRecoveryPhraseButton) {
    await directRecoveryPhraseButton.click()
  } else {
    await expect(page.locator("[role='goToImportWallet']")).toBeVisible()
    await page.locator("[role='goToImportWallet']").click()
    await page.locator("[role='goToImportLocalWallet']").click()

    const recoveryPhraseButton = await findFirstVisible(getRecoveryPhraseLocators(page), 5_000)
    if (!recoveryPhraseButton) {
      throw new Error("VeWorld recovery phrase option not found")
    }

    await recoveryPhraseButton.click()
  }

  await fillMnemonic(page)
  await page.getByTestId("importLocalWalletMnemonicButton").click()

  const continueAfterImport = await findFirstVisible(
    [page.getByTestId("goToHomepage"), page.getByRole("button", { name: /^continue$/i })],
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

  const state = await detectWalletState(page, 15_000)
  if (state === "dashboard") return
  if (state === "unlock") return unlockWallet(page)
  if (state === "onboarding") return completeOnboarding(page)

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

  // Single instant scan — DOES NOT block, just checks current visibility across all candidates
  // in parallel. Loops with `veworldTargetPollMs` between iterations so the poll budget is
  // governed by `attempts`, not by sequential per-locator timeouts.
  const hasAnyVisible = async (target: VeWorldApprovalTarget): Promise<boolean> => {
    const locators = [
      ...getConnectionApproveLocators(target),
      ...getConnectionConfirmLocators(target),
      ...getConnectionPasswordLocators(target),
    ]
    const results = await Promise.all(
      locators.map(locator =>
        locator
          .first()
          .isVisible()
          .catch(() => false),
      ),
    )
    return results.some(Boolean)
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (extensionPage && !extensionPage.isClosed()) {
      // Do not match dashboard "welcome back" alone — TX signing opens a separate extension popup;
      // returning the fixture extension page would send clicks to the wrong document.
      if (await hasAnyVisible(extensionPage)) return extensionPage
    }

    // `elementHandle()` blocks indefinitely (timeout 0) when the frame doesn't exist; use
    // `count()` first because it returns immediately. In headless the connection sign popup
    // opens as a standalone chrome-extension:// page, so #veworld-frame is often absent.
    if ((await page.locator("#veworld-frame").count()) > 0) {
      const frameHandle = await page
        .locator("#veworld-frame")
        .elementHandle({ timeout: 1_000 })
        .catch(() => null)
      const frame = await frameHandle?.contentFrame()
      if (frame && (await hasAnyVisible(frame))) return frame
    }

    const extensionPages = page
      .context()
      .pages()
      .filter(contextPage => contextPage.url().startsWith("chrome-extension://"))
      .reverse()

    for (const candidate of extensionPages) {
      if (await hasAnyVisible(candidate)) return candidate
    }

    await page.waitForTimeout(veworldTargetPollMs)
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

type ApproveConnectionOptions = {
  maxSteps?: number
}

/**
 * Returns true when the dApp shows it's connected — either explicit `wallet-connected` testID,
 * or the post-connect "Terms and Policies" modal (handled later by `waitForClearPage`).
 * Used to avoid waiting for a VeWorld popup that has already closed after a successful sign.
 */
const isAppPostConnectionVisible = async (page: Page): Promise<boolean> => {
  const indicators = [
    page.getByTestId("wallet-connected").first(),
    page.getByRole("button", { name: /^accept all$/i }).first(),
    page.getByText(/terms and policies/i).first(),
  ]
  const results = await Promise.all(indicators.map(l => l.isVisible().catch(() => false)))
  return results.some(Boolean)
}

export const approveConnection = async (
  page: Page,
  extensionPage?: Page,
  isConnected?: () => boolean,
  options?: ApproveConnectionOptions,
) => {
  const maxSteps = options?.maxSteps ?? 20

  if (process.env.B3TR_E2E_PAUSE_ON_FRAME_READY === "true") {
    console.log("Paused after resolving VeWorld approval UI")
    await page.pause()
  }

  for (let step = 0; step < maxSteps; step++) {
    if (isConnected?.()) return

    let target: VeWorldApprovalTarget
    try {
      target = await getVeWorldApprovalTarget(page, extensionPage, step === 0 ? 40 : 10)
    } catch (error) {
      // The sign popup may close before our poll catches it (esp. headless). If the dApp
      // already shows post-connection state, treat the flow as complete.
      if (await isAppPostConnectionVisible(page)) return
      throw error
    }

    if ("bringToFront" in target) {
      await target.bringToFront()
    }

    // Race the three known states. Password prompt may overlay the sign dialog (TX-signing
    // path) so we still process it before approve when both are present — `detectActionButton`
    // checks password first within each polling tick.
    const detected = await detectActionButton(target, step === 0 ? 15_000 : 2_000)

    if (detected?.kind === "password") {
      await detected.locator.fill(walletPassword)

      // Race the candidate submit buttons in parallel — sequential `click({timeout:1_000})`
      // would burn ~1s per non-matching locator (~3s observed before the parallel switch).
      const submitButton = await findFirstVisible(getConnectionPasswordSubmitLocators(target), 1_500)
      if (submitButton) {
        await submitButton.click({ force: true })
      } else {
        await detected.locator.press("Enter")
      }

      await page.waitForTimeout(veworldAfterPasswordMs)
      if (isConnected?.()) return
      continue
    }

    if (detected?.kind === "approve") {
      await detected.locator.click({ force: true })
      if (process.env.B3TR_E2E_PAUSE_AFTER_APPROVE === "true") {
        console.log("Paused after clicking VeWorld approve")
        await page.pause()
      }
      await page.waitForTimeout(veworldAfterApproveMs)
      continue
    }

    if (detected?.kind === "confirm") {
      await detected.locator.click({ force: true })
      await page.waitForTimeout(veworldAfterConfirmMs)
      continue
    }

    if (await isAppPostConnectionVisible(page)) return
    if (isConnected?.()) return

    await page.waitForTimeout(veworldIdleBetweenStepsMs)
  }

  if (await isAppPostConnectionVisible(page)) return
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

  await approveConnection(page, extensionPage, () => confirmed, { maxSteps: 45 })
  await successModal
  await page.getByRole("button", { name: /^done$/i }).click()
}
