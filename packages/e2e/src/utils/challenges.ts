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
  await page.goto(`${baseUrl}/b3mo-quests`, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
  await waitForClearPage(page)
}

export const openCreateChallengeModal = async (page: Page) => {
  await page
    .getByRole("button", { name: /create b3mo quest/i })
    .first()
    .click()
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 })
}

export const openCreateSponsoredChallengeModal = async (page: Page) => {
  await page.getByRole("button", { name: /create sponsored b3mo quest/i }).click()
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 })
}

/**
 * Walks the B3MO Quest create wizard ([apps/frontend/src/app/b3mo-quests/components/CreateChallengeModal](apps/frontend/src/app/b3mo-quests/components/CreateChallengeModal)).
 *
 * The wizard is step-driven (`STEP_ORDER` in types.ts):
 *   kind -> visibility? -> challengeType? -> typeExplainer -> title -> amount
 *   -> splitWin* -> startRound -> duration -> appScope -> selectedApps?
 *   -> invitees? -> review
 *
 * For default Bet (Stake) kind, visibility=Private and challengeType=MaxActions are pre-filled,
 * so visibility/challengeType/splitWin steps are skipped (`isRelevant=false`).
 * `typeExplainer` auto-advances via `withTyping`. We click choice buttons by their inner text
 * because the button accessible name concatenates description text too.
 */
export const fillCreateChallengeForm = async (
  page: Page,
  opts: {
    amount: string
    kind?: "Stake" | "Sponsored"
    title?: string
    visibility?: "Public" | "Private"
    duration?: 1 | 2 | 3 | 4
    splitPrize?: boolean
    threshold?: string
  },
) => {
  const dialog = page.getByRole("dialog")
  const kind = opts.kind ?? "Stake"
  const visibility = opts.visibility ?? (kind === "Stake" ? "Private" : "Public")

  const clickChoice = (label: string) => dialog.locator(`button:has(:text-is("${label}"))`).first().click()

  const kindLabel = kind === "Stake" ? "Bet" : "Sponsored"
  await clickChoice(kindLabel)

  if (kind === "Sponsored") {
    await clickChoice(visibility)
    const challengeTypeLabel = opts.splitPrize ? "Split win" : "Max actions"
    await clickChoice(challengeTypeLabel)
  }

  const titleStep = dialog.getByText(/^title \(optional\)$/i)
  await titleStep.first().waitFor({ state: "visible", timeout: 15_000 })
  if (opts.title) {
    const titleInput = dialog.locator("input").first()
    await titleInput.fill(opts.title)
  }
  await dialog.getByRole("button", { name: /^continue$/i }).click()

  const amountQuickButton = dialog.getByRole("button", { name: new RegExp(`^${opts.amount}\\s*B3TR$`, "i") }).first()
  await amountQuickButton.waitFor({ state: "visible", timeout: 15_000 })
  await amountQuickButton.click()

  if (kind === "Sponsored" && opts.splitPrize) {
    const numWinnersContinue = dialog.getByRole("button", { name: /^continue$/i })
    await numWinnersContinue.waitFor({ state: "visible", timeout: 15_000 })
    await numWinnersContinue.click()

    if (opts.threshold) {
      const thresholdInput = dialog.locator('input[type="number"]').first()
      await thresholdInput.fill(opts.threshold)
    }
    await dialog.getByRole("button", { name: /^continue$/i }).click()
  }

  const startRoundButton = dialog.getByRole("button", { name: /^next round$/i })
  await startRoundButton.waitFor({ state: "visible", timeout: 15_000 })
  await startRoundButton.click()

  const duration = opts.duration ?? 1
  const durationLabel = duration === 1 ? `${duration} round` : `${duration} rounds`
  await dialog.getByRole("button", { name: new RegExp(`^${durationLabel}$`, "i") }).click()

  await dialog.getByRole("button", { name: /^all apps$/i }).click()

  if (visibility === "Private") {
    const skip = dialog.getByRole("button", { name: /^skip$/i })
    await skip.waitFor({ state: "visible", timeout: 15_000 })
    await skip.click()
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
