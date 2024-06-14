import { describe, expect, it } from "vitest"
import NewProposalPreviewAndPublishPage from "./page"
import { fireEvent, render, screen, waitFor } from "../../../../../../test"
import * as router from "next/navigation"
import * as dappKit from "@vechain/dapp-kit-react"
import * as store from "@/store"
import * as hooks from "@/hooks"
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
spyOnUseMetadataUpload.mockReturnValue({
  onMetadataUpload: mockOnMetadataUpload.mockReturnValue("123"),
  metadataUploadError: undefined,
  metadataUploading: false,
})

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/preview")

const spyOnUseProposalFormStore = vi.spyOn(store, "useProposalFormStore")

describe("NewProposalPreviewAndPublish", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
    spyOnUseProposalFormStore.mockClear()
  })

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    const x = render(
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
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
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
        <NewProposalPreviewAndPublishPage />
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
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
  }) // redirects to /proposals/new if one of the required fields is not available

  it("should render correctly - no actions", async () => {
    const markdown = "Markdown test placeholder"
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Titles",
      shortDescription: "Short descriptions",
      markdownDescription: markdown,
      actions: [],
    })

    render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await screen.findByTestId("new-proposal-preview-page")
    await screen.findByText("Check your proposal before publishing")

    expect(screen.queryByTestId("proposal-actions-container")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-title-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-description-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("new-proposal-form")).not.toBeInTheDocument()

    await screen.findByText(markdown)

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(continueButton)
    expect(mockOnMetadataUpload).toHaveBeenCalledWith({
      title: "Titles",
      shortDescription: "Short descriptions",
      markdownDescription: markdown,
    })
    expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/round")
  }) // should render correctly - no actions

  it("should render correctly - actions", async () => {
    const markdown = "Markdown test placeholder"
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Titles",
      shortDescription: "Short descriptions",
      markdownDescription: markdown,
      actions: [transferAction],
    })

    render(
      <FormProposalLayout>
        <NewProposalPreviewAndPublishPage />
      </FormProposalLayout>,
    )
    await screen.findByTestId("new-proposal-preview-page")
    await screen.findByText("Check your proposal before publishing")

    expect(screen.queryByTestId("proposal-title-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-description-input")).not.toBeInTheDocument()

    expect(screen.queryByTestId("new-proposal-form")).toBeInTheDocument()
    expect(screen.queryByTestId("proposal-actions-container")).toBeInTheDocument()

    await screen.findByText(markdown)

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(mockOnMetadataUpload).toHaveBeenCalledWith({
        title: "Titles",
        shortDescription: "Short descriptions",
        markdownDescription: markdown,
      })
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/round")
    })
  }) // should render correctly - no actions
}) // NewProposal
