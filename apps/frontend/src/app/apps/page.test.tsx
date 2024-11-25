import { expect, test, describe } from "vitest"
import Apps from "./page"
import { render, screen } from "../../../test"
import * as hooks from "@/api/contracts/xApps"
import * as allocationHooks from "@/api/contracts/xAllocations"

describe("Apps", () => {
  test("XApps available - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: {
        active: [
          {
            id: "1",
            name: "Round 1",
            teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
            createdAtTimestamp: "16347455",
            metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
          },
        ],
        unendorsed: [],
        allApps: [],
      },
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(allocationHooks, "usePreviousAllocationRoundId").mockReturnValue({
      data: "1",
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useMostVotedAppsInRound").mockReturnValue({
      data: [
        {
          id: "1",
          percentage: 20,
          app: {
            id: "1",
            name: "GreenCart",
            teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
            createdAtTimestamp: "16347455",
            metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
          },
        },
      ],
      isLoading: false,
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

    //@ts-ignore
    vi.spyOn(allocationHooks, "usePreviousAllocationRoundId").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useMostVotedAppsInRound").mockReturnValue({
      data: [],
      isLoading: true,
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

    //@ts-ignore
    vi.spyOn(allocationHooks, "usePreviousAllocationRoundId").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useMostVotedAppsInRound").mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<Apps />)
    expect(screen.queryByTestId("apps-page-loading")).not.toBeInTheDocument()
  })
})
