import { expect, test } from "vitest"
import Home from "./page"
import { render, screen } from "../../test"

test("Homepage", async () => {
  render(<Home />)
  expect(await screen.findByTestId("homepage")).toBeInTheDocument()
})
