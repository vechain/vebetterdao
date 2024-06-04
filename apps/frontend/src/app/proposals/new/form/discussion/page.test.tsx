import { describe, expect, it } from "vitest"
import NewProposalTextOnlyPage from "./page"
import { fireEvent, render, screen, waitFor, within } from "../../../../../../test"
import * as router from "next/navigation"
import * as dappKit from "@vechain/dapp-kit-react"
import FormProposalLayout from "../layout"
import { GovernanceProposalTemplate, removePlaceholders } from "@/constants"

const mockRouterPush = vi.fn()
const mockBack = vi.fn()
//@ts-ignore
vi.spyOn(router, "useRouter").mockReturnValue({
  push: mockRouterPush,
  replace: vi.fn(),
  back: mockBack,
})

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/discussion")

describe("NewProposalDiscussion", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    const x = render(
      <FormProposalLayout>
        <NewProposalTextOnlyPage />
      </FormProposalLayout>,
    )

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  it("form errors - should render correctly", async () => {
    render(
      <FormProposalLayout>
        <NewProposalTextOnlyPage />
      </FormProposalLayout>,
    )
    await screen.findByTestId("new-proposal-textonly-page", undefined, { timeout: 2000 })
    await screen.findByText("General proposal")
    await screen.findByText(
      "Choose a title a short description for your proposal. You will be able to provide more details in the next step.",
    )

    const titleInput = await screen.findByTestId("proposal-title-input")
    const descriptionInput = await screen.findByTestId("proposal-description-input")
    expect(screen.queryByTestId("proposal-markdown-description-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-actions-input")).not.toBeInTheDocument()

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()

    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.queryByTestId("newproposal-form-description-error-message")).toBeInTheDocument()
      expect(screen.queryByTestId("newproposal-form-title-error-message")).toBeInTheDocument()
    })
    fireEvent.change(titleInput, { target: { value: "Title" } })
    fireEvent.change(descriptionInput, { target: { value: "Description" } })
    await waitFor(() => {
      expect(screen.queryByTestId("newproposal-form-description-error-message")).not.toBeInTheDocument()
      expect(screen.queryByTestId("newproposal-form-title-error-message")).not.toBeInTheDocument()
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  }) // form errors - should render correctly
  it("no errors - should render correctly", async () => {
    render(
      <FormProposalLayout>
        <NewProposalTextOnlyPage />
      </FormProposalLayout>,
    )
    await screen.findByTestId("new-proposal-textonly-page", undefined, { timeout: 2000 })
    await screen.findByText("General proposal")
    await screen.findByText(
      "Choose a title a short description for your proposal. You will be able to provide more details in the next step.",
    )

    const titleInput = await screen.findByTestId("proposal-title-input")
    const descriptionInput = await screen.findByTestId("proposal-description-input")
    expect(screen.queryByTestId("proposal-markdown-description-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("proposal-actions-input")).not.toBeInTheDocument()

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()

    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.queryByTestId("newproposal-form-description-error-message")).toBeInTheDocument()
      expect(screen.queryByTestId("newproposal-form-title-error-message")).toBeInTheDocument()
    })
    fireEvent.change(titleInput, { target: { value: "Title" } })
    fireEvent.change(descriptionInput, { target: { value: "Description" } })
    await waitFor(() => {
      expect(screen.queryByTestId("newproposal-form-description-error-message")).not.toBeInTheDocument()
      expect(screen.queryByTestId("newproposal-form-title-error-message")).not.toBeInTheDocument()
    })
    fireEvent.click(continueButton)
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/content"))
  }) // form errors - should render correctly
}) // NewProposal
