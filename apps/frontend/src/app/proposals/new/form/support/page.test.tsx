import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { fireEvent, screen } from "@testing-library/react"
import * as vechainKit from "@vechain/vechain-kit"
import * as router from "next/navigation"
import { vi } from "vitest"

import * as apiHooks from "@/api"
import * as hooks from "@/hooks"
import * as store from "@/store"

import { render, waitFor } from "../../../../../../test"
import FormProposalLayout from "../layout"

import NewProposalSupport from "./page"

/**
 * Check for the existence of the functions listed in the dev contracts
 */
const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})
const spyOnUseProposalFormStore = vi.spyOn(store, "useProposalFormStore")
vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/support")
const spyOnVot3Balance = vi.spyOn(hooks, "useGetVot3Balance")
const spyOnThreshold = vi.spyOn(apiHooks, "useDepositThreshold")
const compactFormatter = getCompactFormatter(2)
const vot3Amount = "100"
const threshold = "1000"
describe("NewProposalSupport", async () => {
  beforeEach(() => {
    // vi.clearAllMocks()
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()
    //@ts-ignore
    spyOnVot3Balance.mockReturnValue({
      data: {
        formatted: vot3Amount,
        original: "100000000000000000",
        scaled: vot3Amount,
      },
      isLoading: false,
    })
    //@ts-ignore
    spyOnThreshold.mockReturnValue({
      data: threshold,
      isLoading: false,
    })
  })

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(vechainKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  it("redirects to /proposals/new if one of the required fields is not available", async () => {
    //no title
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "",
      shortDescription: "Description",
      markdownDescription: "fffd",
      votingStartRoundId: undefined,
    })
    const page = render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()

    //no short
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "ffff",
      shortDescription: "",
      markdownDescription: "fffd",
      actions: [],
      votingStartRoundId: undefined,
    })
    page.rerender(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()

    //no markdown
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "ffff",
      shortDescription: "fffff",
      markdownDescription: "",
      actions: [],
      votingStartRoundId: undefined,
    })
    page.rerender(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
  }) // redirects to /proposals/new if one of the required fields is not available

  it("renders correctly", async () => {
    spyOnUseProposalFormStore.mockReturnValue({
      title: "ffff",
      shortDescription: "fff",
      markdownDescription: "fffd",
      actions: [],
      votingStartRoundId: undefined,
    })

    render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )

    await screen.findByText("Community support")
    await screen.findByText(
      `Your proposal will need support from the community to become active. Users who like your proposal and want to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will need a total of ${compactFormatter.format(Number(threshold))} VOT3 to become active. You can also contribute with your own VOT3.`,
    )
    await screen.findByText("How much VOT3 do you want to lock to fund this proposal?")
    await screen.findByText("Your VOT3 will be unlocked when the voting session ends.")

    await screen.findByText(`Your current VOT3 balance is ${compactFormatter.format(Number(vot3Amount))}`)
    await screen.findByText(`/ ${compactFormatter.format(Number(threshold))}`)

    const goBack = await screen.findByTestId("go-back")
    await screen.findByTestId("continue")

    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
  }) // renders correctly

  it("renders correctly - fields loading", async () => {
    spyOnUseProposalFormStore.mockReturnValue({
      title: "ffff",
      shortDescription: "fff",
      markdownDescription: "fffd",
      actions: [],
      votingStartRoundId: 1,
    })

    spyOnVot3Balance.mockClear()
    //@ts-ignore
    spyOnVot3Balance.mockReturnValue({
      data: undefined,
      isLoading: true,
    })
    spyOnThreshold.mockClear()
    //@ts-ignore
    spyOnThreshold.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )

    await screen.findByText("Community support")
    await screen.findByText(
      `Your proposal will need support from the community to become active. Users who like your proposal and want to be able to vote for it can contribute with their VOT3 tokens to support it. The proposal will need a total of NaN VOT3 to become active. You can also contribute with your own VOT3.`,
    )
    await screen.findByText("How much VOT3 do you want to lock to fund this proposal?")

    await screen.findByText("Your VOT3 will be unlocked when the voting session ends.")
    await screen.findByText(`Your current VOT3 balance is`)
    await screen.findByText(`/ NaN`)

    const goBack = await screen.findByTestId("go-back")
    await screen.findByTestId("continue")

    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
  }) // renders correctly

  it("renders correctly - form errors", async () => {
    spyOnUseProposalFormStore.mockReturnValue({
      title: "ffff",
      shortDescription: "fff",
      markdownDescription: "fffd",
      actions: [],
      votingStartRoundId: 1,
    })

    render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )

    const vot3Input = await screen.findByTestId("vot3-amount-input")

    //amount exceed balance
    fireEvent.change(vot3Input, { target: { value: Number(vot3Amount) + 1 } })

    const continueButton = await screen.findByTestId("continue")

    fireEvent.click(continueButton)
    await waitFor(async () => {
      const errorMessage = await screen.findByTestId("amount-input-error-message")
      expect(errorMessage).toHaveTextContent("Insufficient balance")
    })

    // amount exceed threshold
    fireEvent.change(vot3Input, { target: { value: Number(threshold) + 1 } })
    await waitFor(async () => {
      const errorMessage = await screen.findByTestId("amount-input-error-message")
      expect(errorMessage).toHaveTextContent(`The maximum amount is ${threshold}`)
    })

    //field required
    fireEvent.change(vot3Input, { target: { value: "" } })
    await waitFor(async () => {
      const errorMessage = await screen.findByTestId("amount-input-error-message")
      expect(errorMessage).toHaveTextContent(`This field is required`)
    })
  }) // renders correctly - form errors

  it("renders correctly - submit", async () => {
    const mockSetData = vi.fn()
    spyOnUseProposalFormStore.mockReturnValue({
      title: "ffff",
      shortDescription: "fff",
      markdownDescription: "fffd",
      actions: [],
      votingStartRoundId: 1,
      setData: mockSetData,
    })

    render(
      <FormProposalLayout>
        <NewProposalSupport />
      </FormProposalLayout>,
    )

    const vot3Input = await screen.findByTestId("vot3-amount-input")
    expect(vot3Input).toHaveValue("0")

    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(continueButton)

    await waitFor(() => {
      const errorMessage = screen.queryByTestId("amount-input-error-message")
      expect(errorMessage).not.toBeInTheDocument()
      expect(mockSetData).toHaveBeenCalledWith({ depositAmount: 0 })
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/preview-and-publish")
    })
  }) // renders correctly - form errors
})
