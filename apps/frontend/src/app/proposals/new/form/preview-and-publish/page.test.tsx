import { describe, expect, it } from "vitest"
import NewProposalPreviewAndPublishPage from "./page"
import { fireEvent, render, screen, waitFor } from "../../../../../../test"
import * as router from "next/navigation"
import * as vechainKit from "@vechain/vechain-kit"
import * as store from "@/store"
import * as hooks from "@/hooks"
import * as apiHooks from "@/api"
import FormProposalLayout from "../layout"
import { transferAction } from "../../../../../../__mocks__/Actions"

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})

const mockOnMetadataUpload = vi.fn()
const spyOnUseMetadataUpload = vi.spyOn(hooks, "useUploadProposalMetadata")

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/preview-and-publish")

const spyOnUseProposalFormStore = vi.spyOn(store, "useProposalFormStore")
const spyOnuseCreateProposal = vi.spyOn(hooks, "useCreateProposal")

const mockSendTransaction = vi.fn()

const threshold = "1000"

const spyOnThreshold = vi.spyOn(apiHooks, "useDepositThreshold")

describe("NewProposalPreviewAndPublish", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
    spyOnUseProposalFormStore.mockClear()

    spyOnUseMetadataUpload.mockReturnValue({
      onMetadataUpload: mockOnMetadataUpload.mockReturnValue("123"),
      metadataUploadError: undefined,
      metadataUploading: false,
    })

    //@ts-ignore
    spyOnThreshold.mockReturnValue({
      data: threshold,
      isLoading: false,
    })

    //@ts-ignore
    spyOnuseCreateProposal.mockReturnValue({
      isTransactionPending: false,
      txReceipt: null,
      sendTransaction: mockSendTransaction,
      resetStatus: vi.fn(),
      status: "pending",
      error: undefined,
    })
  }) // beforeEach

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(vechainKit, "useWallet").mockReturnValueOnce({
      account: null,
    })

    render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
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
      votingStartRoundId: 1,
      depositAmount: 0,
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()

    //no short
    spyOnUseProposalFormStore.mockClear()
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "",
      markdownDescription: "fffd",
      votingStartRoundId: 1,
      depositAmount: 0,
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()

    //no markdown
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "",
      votingStartRoundId: 1,
      depositAmount: 0,
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()

    //no votingStartRoundId
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "",
      votingStartRoundId: undefined,
      depositAmount: 0,
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()

    //no depositAmount
    spyOnUseProposalFormStore.mockReturnValueOnce({
      title: "Title",
      shortDescription: "shortDescription",
      markdownDescription: "",
      votingStartRoundId: 1,
      depositAmount: undefined,
    })

    component.rerender(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()
  }) // redirects to /proposals/new if one of the required fields is not available

  it("should render correctly - no actions - sendTransaction called with the correct data", async () => {
    const markdown = "Markdown test placeholder"
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Titles",
      shortDescription: "Short descriptions",
      markdownDescription: markdown,
      actions: [],
      votingStartRoundId: 1,
      depositAmount: 0,
    })

    render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await vi.dynamicImportSettled()
    await screen.findByTestId("new-proposal-preview-page")
    await screen.findByText("Check your proposal before publishing")

    expect(screen.queryByTestId("proposal-actions-container")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-title-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-description-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("new-proposal-form")).not.toBeInTheDocument()
    expect(screen.queryByTestId("transaction-modal")).not.toBeInTheDocument()

    expect(screen.queryByTestId("proposal-support-progress-chart")).toBeInTheDocument()
    expect(screen.queryByTestId("round-radio-card")).toBeInTheDocument()

    await screen.findByText(markdown)

    const goBack = await screen.findByTestId("go-back")
    const publishButton = await screen.findByTestId("publish")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(mockOnMetadataUpload).toHaveBeenCalledWith({
        title: "Titles",
        shortDescription: "Short descriptions",
        markdownDescription: markdown,
      })
      expect(mockSendTransaction).toHaveBeenCalledWith({
        actions: [],
        description: "123",
        startRoundId: 1,
        depositAmount: "0",
      })
      //   expect(screen.queryByTestId("transaction-modal")).toBeInTheDocument()
    })
  }) // should render correctly - no actions

  it("should render correctly - actions - sendTransaction called with correct data", async () => {
    const markdown = "Markdown test placeholder"
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Titles",
      shortDescription: "Short descriptions",
      markdownDescription: markdown,
      actions: [transferAction],
      votingStartRoundId: 1,
      depositAmount: 0,
    })

    render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await vi.dynamicImportSettled()
    await screen.findByTestId("new-proposal-preview-page")
    await screen.findByText("Check your proposal before publishing")

    expect(screen.queryByTestId("proposal-title-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-description-input")).not.toBeInTheDocument()

    expect(screen.queryByTestId("new-proposal-form")).toBeInTheDocument()
    expect(screen.queryByTestId("proposal-actions-container")).toBeInTheDocument()

    expect(screen.queryByTestId("transaction-modal")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-support-progress-chart")).toBeInTheDocument()
    expect(screen.queryByTestId("round-radio-card")).toBeInTheDocument()

    await screen.findByText(markdown)

    const goBack = await screen.findByTestId("go-back")
    const publishButton = await screen.findByTestId("publish")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(mockOnMetadataUpload).toHaveBeenCalledWith({
        title: "Titles",
        shortDescription: "Short descriptions",
        markdownDescription: markdown,
      })
      expect(mockSendTransaction).toHaveBeenCalledWith({
        actions: [transferAction].map(action => ({
          contractAddress: action.contractAddress,
          calldata: action.calldata as string,
        })),
        description: "123",
        startRoundId: 1,
        depositAmount: "0",
      })

      //   expect(screen.queryByTestId("transaction-modal")).toBeInTheDocument()
    })
  }) // should render correctly - no actions
}) // NewProposal
