import { expect, test } from "vitest"
import Admin from "./page"
import { render, screen } from "../../../test"

test("Allocations", async () => {
  render(<Admin />)
  expect(await screen.findByTestId(`admin-page`)).toBeInTheDocument()
})
