import { expect, test, describe } from "vitest"
import AppDetail from "./page"
import { render, screen } from "../../../../test"
import * as hooks from "@/api/contracts/xApps"

describe("AppDetail", () => {
  test("XApps available - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: [
        {
          createdAt: 12347455,
          id: "1",
          name: "Round 1",
          receiverAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
          adminAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
          createdAtTimestamp: 16347455,
          metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
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
