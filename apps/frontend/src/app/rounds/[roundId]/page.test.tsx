import { expect, test } from "vitest"
import AllocationDetail from "./page"
import { render, screen } from "../../../../test"

import * as hooks from "@/api/contracts/xAllocations"

test("Allocations", async () => {
  //@ts-ignore
  vi.spyOn(hooks, "useAllocationsRoundState").mockReturnValue({
    data: "1",
    isLoading: false,
    isError: false,
  })

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
