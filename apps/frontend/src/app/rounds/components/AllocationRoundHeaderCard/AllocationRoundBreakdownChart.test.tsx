import { render } from "../../../../../test"
import { AllocationRoundBreakdownChart } from "./AllocationRoundBreakdownChart"
import * as apiHooks from "../../../../api"

const spyOnUseAllocationAmount = vi.spyOn(apiHooks, "useAllocationAmount")
describe("AllocationRoundBreakdownChart", () => {
  it("loading - should render correctly", async () => {
    //@ts-ignore
    spyOnUseAllocationAmount.mockReturnValueOnce({ data: undefined, isLoading: true })
    const screen = render(<AllocationRoundBreakdownChart roundId="1" />)
    await screen.findByTestId("allocation-round-breakdown-chart")
    await screen.findByText("Total allocation to distribute") //should render the loading text
  }) //loading - should render correctly

  it("not loading with data - should render correctly", async () => {
    //@ts-ignore
    spyOnUseAllocationAmount.mockReturnValueOnce({
      data: {
        treasury: "1000",
        voteXAllocations: "2000",
        voteX2Earn: "2000",
      },
      isLoading: false,
    })
    const screen = render(<AllocationRoundBreakdownChart roundId="1" />)
    await screen.findByTestId("allocation-round-breakdown-chart")
    await screen.findByText("Total allocation to distribute") //should render the loading text
  }) //not loading with data - should render correctly
}) //AllocationRoundBreakdownChart
