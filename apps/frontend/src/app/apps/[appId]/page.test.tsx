import { expect, test, describe } from "vitest"
import AppDetail from "./page"
import { render, screen } from "../../../../test"
import * as hooks from "@/api/contracts/xApps"

describe("Allocations", () => {
  test("XApps available - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: [
        {
          createdAt: 12347455,
          id: "1",
          name: "Round 1",
          receiverAddress: "0x0000",
        },
      ],
      isLoading: false,
      isError: false,
    })

    const appId = "1"
    render(
      <AppDetail
        params={{
          appId,
        }}
      />,
    )
    expect(await screen.findByTestId(`app-${appId}-detail`)).toBeInTheDocument()
  })
})
