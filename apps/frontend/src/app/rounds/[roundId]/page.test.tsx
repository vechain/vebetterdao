import { expect, test } from "vitest"
import AllocationDetail from "./page"
import { render, screen } from "../../../../test"

test("Allocations", async () => {
  const roundId = "1"
  render(
    <AllocationDetail
      params={{
        roundId,
      }}
    />,
  )
  expect(await screen.findByTestId(`allocation-${roundId}-page`)).toBeInTheDocument()
})
