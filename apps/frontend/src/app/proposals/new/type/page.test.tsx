import { describe, expect, vi } from "vitest"
import NewproposalPage from "./page"
import { fireEvent, render, renderHook, screen, waitFor } from "../../../../../test"
import * as router from "next/navigation"
import * as dappKit from "@vechain/dapp-kit-react"
import { Steps } from "./components/NewProposalTypePageContent"
import { useTranslation } from "react-i18next"

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})

describe("NewProposalType", async () => {
  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(<NewproposalPage />)
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  it("should render correctly", async () => {
    const x = render(<NewproposalPage />)
    await screen.findByTestId("new-proposal-type-page")
    await screen.findByText("Select proposal type")

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()

    const { result } = renderHook(() => useTranslation())

    //TODO: validate styles of radio and card when checked and not
    await waitFor(
      async () => {
        expect(result.current.t).toBeTruthy()
        const steps = Steps(result.current.t)
        for (const step of steps) {
          const card = await screen.findByTestId(`checkable-card__${step.title}`)
          //   const radio = await screen.findByTestId(`checkable-card__${step.title}__radio`)
          await screen.findByText(step.title)
          await screen.findByText(step.description)
          fireEvent.click(card)
          fireEvent.click(continueButton)
          expect(mockRouterPush).toHaveBeenCalledWith(step.route)
        }
      },
      { timeout: 4000 },
    )
  }) // should render correctly
}) // NewProposal
