import * as vechainKit from "@vechain/vechain-kit"
import * as router from "next/navigation"
import { describe, expect, it } from "vitest"

import * as hooks from "@/api"
import * as store from "@/store"

import { fireEvent, render, screen, waitFor } from "../../../../../../test"
import FormProposalLayout from "../layout"

import NewProposalRoundPage from "./page"

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})
vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/round")
const spyOnUseProposalFormStore = vi.spyOn(store, "useProposalFormStore")
const spyOncurrentRoundId = vi.spyOn(hooks, "useCurrentAllocationsRoundId")
const spyCanStartInNextRound = vi.spyOn(hooks, "useCanProposalStartInNextRound")
describe("NewProposalRound", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()
    spyOncurrentRoundId.mockClear()
    spyCanStartInNextRound.mockClear()
  })
  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(vechainKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected
  it("redirects to /proposals/new if one of the required fields is not available", async () => {
    //no title
    spyOnUseProposalFormStore.mockClear()
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "",
      shortDescription: "Description",
      markdownDescription: "fffd",
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()

    spyOnUseProposalFormStore.mockClear()
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "",
      markdownDescription: "fffd",
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "",
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
  }) // redirects to /proposals/new if one of the required fields is not available

  it("common elements - should render correctly", async () => {
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "fgffdggf",
    })

    render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )

    await screen.findByText("Select a voting session date")
    // await screen.findByText(
    //   "during which your proposal will be considered for voting. Weekly rounds occur regularly on this platform along with the allocations.",
    // )
    const goBack = await screen.findByTestId("go-back")
    await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
  }) // common elements - should render correctly

  it("loading - should render correctly", async () => {
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "fgffdggf",
    })
    // currentRoundId loading
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValue({ data: undefined, isLoading: true })

    render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(0)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(3)

    let continueButton = await screen.findByTestId("continue")

    expect(continueButton).toBeDisabled()

    //canStartInnextRound loading
    spyOncurrentRoundId.mockClear()
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValue({ data: 0, isLoading: false })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValue({ data: false, isLoading: true })

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(0)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(3)

    continueButton = await screen.findByTestId("continue")

    expect(continueButton).toBeDisabled()
  }) // loading - should render correctly

  it("no rounds available - should render correctly", async () => {
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "fgffdggf",
    })

    // no currentRoundId with error
    let error = "No currentRoundId available"
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValueOnce({ data: undefined, isLoading: false, error: new Error(error) })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValueOnce({ data: true, isLoading: false })

    const page = render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(0)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(0)
    await screen.findByText("No rounds available")
    await screen.findByText(error)

    let continueButton = await screen.findByTestId("continue")

    expect(continueButton).toBeDisabled()

    // no canStartInNextRound with error
    error = "No canStartInNextRound available"
    vi.clearAllMocks()
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValueOnce({ data: "1", isLoading: false })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValueOnce({ data: undefined, isLoading: false, error: new Error(error) })

    page.rerender(<NewProposalRoundPage />)

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(0)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(0)
    await screen.findByText("No rounds available")
    await screen.findByText(error)

    // both undefined and no errors - should render correctly
    vi.clearAllMocks()
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValueOnce({ data: undefined, isLoading: false })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValueOnce({ data: undefined, isLoading: false })

    page.rerender(<NewProposalRoundPage />)
    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(0)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(0)
    await screen.findByText("No rounds available")
    await screen.findByText("Emissions have propably not started yet")
  }) // loading - should render correctly

  it("rounds available - should render correctly", async () => {
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "fgffdggf",
    })

    // can start in next round
    let currentRoundId = "1"
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValueOnce({ data: currentRoundId, isLoading: false })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValueOnce({ data: true, isLoading: false })

    const page = render(
      <FormProposalLayout>
        <NewProposalRoundPage />
      </FormProposalLayout>,
    )

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(3)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(0)
    expect(screen.queryByText("No rounds available")).not.toBeInTheDocument()

    for (let i = 0; i < Number(currentRoundId); i++) {
      await screen.findByText(`Round #${i + 2}`)
    }

    let continueButton = await screen.findByTestId("continue")

    expect(continueButton).toBeDisabled()

    fireEvent.click(screen.getAllByTestId("round-radio-card")[0] as Element)

    fireEvent.click(continueButton)
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/support"))

    // can not start in next round
    vi.clearAllMocks()
    //@ts-ignore
    spyOncurrentRoundId.mockReturnValueOnce({ data: currentRoundId, isLoading: false })
    //@ts-ignore
    spyCanStartInNextRound.mockReturnValueOnce({ data: false, isLoading: false })
    page.rerender(<NewProposalRoundPage />)

    expect(screen.queryAllByTestId("round-radio-card")).toHaveLength(3)
    expect(screen.queryAllByTestId("round-radio-card-skeleton")).toHaveLength(0)
    expect(screen.queryByText("No rounds available")).not.toBeInTheDocument()

    for (let i = 0; i < Number(currentRoundId); i++) {
      await screen.findByText(`Round #${i + 3}`)
    }

    continueButton = await screen.findByTestId("continue")

    fireEvent.click(screen.getAllByTestId("round-radio-card")[0] as Element)

    fireEvent.click(continueButton)
  }) // loading - should render correctly
}) // NewProposal
