import { connectWithVeWorld, expect, test } from "../../src/fixtures/veworld"

test("connects VeWorld from the navbar", async ({ appPage }) => {
  await expect(appPage.getByRole("button", { name: /^login$/i }).first()).toBeVisible()

  await connectWithVeWorld(appPage)

  await expect(appPage.getByTestId("wallet-connected")).toBeVisible()
})
