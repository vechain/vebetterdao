import { expect, test } from "vitest"
import Allocations from "./page"
import { render, screen } from "../../../test"

test("Allocations", async () => {
  render(<Allocations />)
  expect(await screen.findByTestId("allocations-page")).toBeInTheDocument()
})
