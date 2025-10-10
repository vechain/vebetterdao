import { expect, test } from "vitest"

import { render, screen } from "../../../test"

import Admin from "./page"

test("Admin", async () => {
  render(<Admin />)
  const adminPage = await screen.findByTestId("admin-page", {}, { timeout: 5000 })
  expect(adminPage).toBeInTheDocument()
})
