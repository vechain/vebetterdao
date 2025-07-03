import { render } from "../../../../../test"
import { AllocationRoundBreakdownChart } from "./AllocationRoundBreakdownChart"
import * as apiHooks from "../../../../api"
import * as chakra from "@chakra-ui/react"

vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual("@chakra-ui/react")
  return {
    ...actual,
    useMediaQuery: vi.fn(() => [true]),
  }
})

const spyOnUseAllocationAmount = vi.spyOn(apiHooks, "useAllocationAmount")
describe("AllocationRoundBreakdownChart", () => {
  it("mobile - loading - should render correctly", async () => {
    vi.spyOn(chakra, "useMediaQuery").mockReturnValueOnce([false])
    //@ts-ignore
    spyOnUseAllocationAmount.mockReturnValueOnce({ data: undefined, isLoading: true })
    const screen = render(<AllocationRoundBreakdownChart roundId="1" />)
    await screen.findByTestId("allocation-round-breakdown-chart")
    await screen.findByText("Total allocation to distribute") //should render the loading text
  }) //loading - should render correctly

  it("desktop - not loading with data - should render correctly", async () => {
    vi.spyOn(chakra, "useMediaQuery").mockReturnValueOnce([true])
    //@ts-ignore
    spyOnUseAllocationAmount.mockReturnValueOnce({
      data: {
        treasury: "1000",
        voteXAllocations: "2000",
        voteX2Earn: "2000",
        gm: "1",
      },
      isLoading: false,
    })
    const screen = render(<AllocationRoundBreakdownChart roundId="1" />)
    await screen.findByTestId("allocation-round-breakdown-chart")
    await screen.findByText("Total allocation to distribute") //should render the loading text
  }) //not loading with data - should render correctly
}) //AllocationRoundBreakdownChart
