import { describe, expect } from "vitest"
import NewproposalPage from "./page"
import { fireEvent, render, screen, waitFor } from "../../../../test"
import * as router from "next/navigation"
import * as dappKit from "@vechain/dapp-kit-react"

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})

describe("NewProposal", async () => {
  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(<NewproposalPage />)
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  it("should render correctly", async () => {
    render(<NewproposalPage />)
    await screen.findByTestId("new-proposal-page")
    await screen.findByText("Create a new proposal")
    await screen.findByText(
      "Proposals represent your ideas as a valued member of the DAO community, aimed at enhancing or modifying aspects of the ecosystem. Each proposal undergoes a voting process, and upon approval, is brought to life.",
    )
    await screen.findByText("Creation")
    await screen.findByText("Look for support")
    await screen.findByText("Voting")
    await screen.findByText("Execution")

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(continueButton)
    expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/type")
  }) // should render correctly
}) // NewProposal
