import { expect, test, describe } from "vitest"
import Apps from "./page"
import { render, screen } from "../../../test"
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

    render(<Apps />)
    expect(await screen.findByTestId("apps-page")).toBeInTheDocument()
  })
  test("isLoading - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<Apps />)
    expect(await screen.findByTestId("apps-page-loading")).toBeInTheDocument()
  })

  test("no dapps - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    render(<Apps />)
    expect(screen.queryByTestId("apps-page-loading")).not.toBeInTheDocument()
    expect(screen.queryByTestId("apps-page")).not.toBeInTheDocument()
  })
})
