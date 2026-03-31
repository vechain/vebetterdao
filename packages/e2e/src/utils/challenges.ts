import type { Page } from "@playwright/test"

export const acceptTermsIfPresent = async (page: Page) => {
  const title = page.getByRole("heading", { name: "Terms and Policies" })
  const isVisible = await title.isVisible().catch(() => false)
  if (!isVisible) return

  await page.getByRole("button", { name: "Accept all" }).click()
  await title.waitFor({ state: "hidden", timeout: 15_000 })
}
