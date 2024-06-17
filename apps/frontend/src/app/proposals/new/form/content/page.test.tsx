import { describe, expect, it } from "vitest"
import NewproposalContentPage from "./page"
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

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/content")

describe("NewProposalContent", async () => {
  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(
      <FormProposalLayout>
        <NewproposalContentPage />
      </FormProposalLayout>,
    )

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  it("form errors - should render correctly", async () => {
    render(
      <FormProposalLayout>
        <NewproposalContentPage />
      </FormProposalLayout>,
    )
    await screen.findByTestId("new-proposal-content-page")
    await screen.findByText("Share more about your idea")
    await screen.findByText(
      "Providing more information will help the community understand the purpose of your proposal and make informed voting decisions. Include details such as motivation, a detailed description, or any other relevant information.",
    )
    await screen.findByText("Make sure to replace all the placeholders with your own content.")

    const goBack = await screen.findByTestId("go-back")
    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()
    fireEvent.click(continueButton)

    const formError = await screen.findByTestId("form-error-message")
    expect(formError).toBeInTheDocument()

    expect(
      screen.queryByText("Make sure to replace all the placeholders with your own content."),
    ).not.toBeInTheDocument()
  }) // form errors - should render correctly

  it("form ok - should navigate to the correct page", async () => {
    render(
      <FormProposalLayout>
        <NewproposalContentPage />
      </FormProposalLayout>,
    )

    const templateWithoutPlaceholders = removePlaceholders(GovernanceProposalTemplate)

    const inputBox = await screen.findByTestId("markdown-description-input", undefined, { timeout: 2000 })
    const input = within(inputBox).getByRole("textbox")
    fireEvent.change(input, { target: { value: templateWithoutPlaceholders } })

    await waitFor(() => {
      expect(input).toHaveValue(templateWithoutPlaceholders)
    })

    const continueButton = await screen.findByTestId("continue")
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.queryByTestId("form-error-message")).not.toBeInTheDocument()
      expect(screen.queryByText("Make sure to replace all the placeholders with your own content.")).toBeInTheDocument()
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/round")
    })
  }) // form errors - should render correctly
}) // NewProposal
