import { expect, test, describe } from "vitest"
import EditAppDetail from "./page"
import { render, screen } from "../../../../../test"
import * as hooks from "@/api/contracts/xApps"
import * as dappKit from "@vechain/dapp-kit-react"

const adminAddress = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa"
//mock dappkit
vi.mock("@vechain/dapp-kit-react", async importOriginal => {
  const mod = await importOriginal<typeof import("@vechain/dapp-kit-react")>()
  return {
    ...mod,
    useWallet: () => ({
      account: adminAddress,
    }),
  }
})

const mockedApp: hooks.XApp = {
  createdAt: 12347455,
  id: "1",
  name: "Round 1",
  receiverAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
  createdAtTimestamp: 16347455,
  metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
}

describe("EditAppDetail", () => {
  test("XApps available - Renders correctly", async () => {
    //@ts-ignore
    vi.spyOn(hooks, "useXApps").mockReturnValue({
      data: [mockedApp],
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useXApp").mockReturnValue({
      data: mockedApp,
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useAppAdmin").mockReturnValue({
      data: adminAddress,
      isLoading: false,
      isError: false,
    })

    //@ts-ignore
    vi.spyOn(hooks, "useAppModerators").mockReturnValue({
      data: [adminAddress],
      isLoading: false,
      isError: false,
    })

    const appId = "1"
    render(
      <EditAppDetail
        params={{
          appId,
        }}
      />,
    )
    expect(await screen.findByTestId(`edit-app-${appId}-detail`)).toBeInTheDocument()
  })
})
