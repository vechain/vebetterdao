import { expect, test } from "vitest"

import { render, screen } from "../../test"

import Home from "./page"

test("Homepage", async () => {
  render(<Home />)
  expect(await screen.findByTestId("homepage")).toBeInTheDocument()
})
