import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"

test("connects VeWorld from the navbar", async ({ appPage, extensionPage }) => {
  await expect(appPage.getByRole("button", { name: /^login$/i }).first()).toBeVisible()

  const creatorSubmissionResponse = appPage.waitForResponse(
    response => response.url().includes("/api/app/creator/submission?walletAddress=") && response.status() === 200,
    { timeout: 120_000 },
  )

  await connectWithVeWorld(appPage, extensionPage)

  await creatorSubmissionResponse
})
