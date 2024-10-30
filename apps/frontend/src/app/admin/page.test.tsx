import { expect, test } from "vitest"
import Admin from "./page"
import { render, screen } from "../../../test"

test("Admin", async () => {
  render(<Admin />)
  const adminPage = await screen.findByTestId("admin-page", {}, { timeout: 5000 })
  expect(adminPage).toBeInTheDocument()
})
