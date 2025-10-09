import { expect, test } from "vitest"

import { render, screen } from "../../../test"

import Allocations from "./page"

test("Allocations", async () => {
  render(<Allocations />)
  expect(await screen.findByTestId("allocations-page")).toBeInTheDocument()
})
