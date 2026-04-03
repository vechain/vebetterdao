import type { Page } from "@playwright/test"

export const acceptTermsIfPresent = async (page: Page) => {
  const acceptButton = page.getByRole("button", { name: "Accept all" })
  const visible = await acceptButton.isVisible().catch(() => false)
  if (!visible) return false
  await acceptButton.click()
  await acceptButton.waitFor({ state: "hidden", timeout: 15_000 })
  return true
}

/**
 * Polls until the VeChain Kit overlay (Terms modal, etc.) is gone.
 * The modal can appear with variable delay after wallet connection,
 * so a single check is not enough.
 */
export const waitForClearPage = async (page: Page, timeoutMs = 30_000) => {
  const overlay = page.locator("#vechain-kit-root .chakra-modal__content-container")
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await acceptTermsIfPresent(page)) continue

    const blocked = await overlay.isVisible().catch(() => false)
    if (!blocked) return

    await page.waitForTimeout(500)
  }

  await page.evaluate(() => {
    document.querySelectorAll("#vechain-kit-root .chakra-modal__content-container").forEach(el => el.remove())
  })
}

export const navigateToChallenges = async (page: Page, baseUrl: string) => {
  await page.goto(`${baseUrl}/challenges`, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
  await waitForClearPage(page)
}

export const openCreateChallengeModal = async (page: Page) => {
  await page.getByRole("button", { name: /create challenge/i }).click()
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 })
}

export const openCreateSponsoredChallengeModal = async (page: Page) => {
  await page.getByRole("button", { name: /create sponsored challenge/i }).click()
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 })
}

export const fillCreateChallengeForm = async (
  page: Page,
  opts: {
    amount: string
    kind?: "Stake" | "Sponsored"
    visibility?: "Public" | "Private"
    duration?: 1 | 2 | 3 | 4
    splitPrize?: boolean
    threshold?: string
  },
) => {
  const dialog = page.getByRole("dialog")
  const kind = opts.kind ?? "Stake"
  const visibility = opts.visibility ?? "Public"

  await dialog.getByRole("button", { name: new RegExp(`^${kind}$`, "i") }).click()

  const amountLabel = kind === "Sponsored" ? /prize amount \(b3tr\)/i : /stake amount \(b3tr\)/i
  await dialog.getByLabel(amountLabel).fill(opts.amount)
  await dialog.getByRole("button", { name: /^continue$/i }).click()

  await dialog.getByRole("button", { name: /next round/i }).click()
  await dialog.getByRole("button", { name: new RegExp(`^${opts.duration ?? 1}$`) }).click()

  if (kind === "Sponsored") {
    if (opts.splitPrize) {
      await dialog.getByRole("button", { name: /^split prize$/i }).click()
      const thresholdInput = dialog.getByLabel(/minimum actions/i)
      await thresholdInput.fill(opts.threshold ?? "1")
      await dialog.getByRole("button", { name: /^continue$/i }).click()
    } else {
      await dialog.getByRole("button", { name: /^max actions$/i }).click()
    }
  }

  await dialog.getByRole("button", { name: /^all apps$/i }).click()
  await dialog.getByRole("button", { name: new RegExp(`^${visibility}$`, "i") }).click()

  if (visibility === "Private") {
    await dialog.getByRole("button", { name: /^skip$/i }).click()
  }
}

export const submitCreateChallenge = async (page: Page) => {
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: /^create$/i }).click()
}

export const getChallengeDetailHeading = (page: Page, challengeId: string | number) =>
  page.getByRole("heading", { name: new RegExp(`Challenge #${challengeId}`, "i") })

export const getChallengeActionButton = (page: Page, action: string) =>
  page.getByRole("button", { name: new RegExp(`^${action}$`, "i") })
