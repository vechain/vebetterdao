import NewProposalFunctionsDetails from "./page"
import FormProposalLayout from "../../layout"
import * as store from "@/store"
import * as router from "next/navigation"
import * as dappKit from "@vechain/dapp-kit-react"
import { screen, fireEvent, render, waitFor } from "../../../../../../../test"
import { vi } from "vitest"
import { transferAction } from "../../../../../../../__mocks__/Actions"
import { address } from "../../../../../../../__mocks__"
const spyOnUseProposalFormStore = vi.spyOn(store, "useProposalFormStore")

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

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/functions/details")

const fillGeneratedInput = async (index: number, inputType: string) => {
  const input = await screen.findByTestId(`generated-function-to-call-${index}`)
  switch (inputType) {
    case "address":
      fireEvent.change(input, { target: { value: address } })
      expect(input).toHaveValue(address)
      return
    case "bytes32":
      fireEvent.change(input, { target: { value: "123" } })
      expect(input).toHaveValue("123")
      return
    case "uint256":
      fireEvent.change(input, { target: { value: 10 } })
      expect(input).toHaveValue(10)
      return
  }

  fireEvent.change(input, { target: { value: "0x123" } })
  expect(input).toHaveValue("0x123")
}
describe("NewProposalFunctionsDetails", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouterPush.mockClear()
    spyOnUseProposalFormStore.mockClear()
  })

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
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
      actions: [],
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
      </FormProposalLayout>,
    )
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new"))
    mockRouterPush.mockClear()
  }) // redirects to /proposals/new if one of the required fields is not available

  it("renders correctly - show error on submit as calldata is not available", async () => {
    const mockSetData = vi.fn()
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Title",
      shortDescription: "Description",
      markdownDescription: "fffd",
      actions: [
        {
          ...transferAction,
          calldata: undefined,
        },
      ],
      setData: mockSetData,
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
      </FormProposalLayout>,
    )

    await screen.findByText("What is your proposal about?")
    await screen.findByText("Basic information")
    const continueButton = await screen.findByTestId("continue")
    const goBack = await screen.findByTestId("go-back")

    await screen.findByTestId("proposal-actions-container")
    await screen.findByText("Executable functions")
    const field = await screen.findByTestId(
      `executable-card-${0}-${transferAction.contractAddress}-${transferAction.name}`,
    )
    expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).not.toBeInTheDocument()
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()

    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(mockRouterPush).not.toHaveBeenCalled()
      expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).toBeInTheDocument()
    })
  }) // renders correctly - show error if fields are not filled

  it("renders correctly - can proceed if inputs are filled when calldata in not available", async () => {
    const mockSetData = vi.fn()
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Title",
      shortDescription: "Description",
      markdownDescription: "fffd",
      actions: [
        {
          ...transferAction,
          calldata: undefined,
        },
      ],
      setData: mockSetData,
    })
    render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
      </FormProposalLayout>,
    )

    await screen.findByText("What is your proposal about?")
    await screen.findByText("Basic information")
    const continueButton = await screen.findByTestId("continue")

    await screen.findByTestId("proposal-actions-container")
    await screen.findByText("Executable functions")
    const field = await screen.findByTestId(
      `executable-card-${0}-${transferAction.contractAddress}-${transferAction.name}`,
    )
    for (const [index, input] of transferAction.abiDefinition.inputs.entries()) {
      await fillGeneratedInput(index, input.type)
    }
    fireEvent.click(continueButton)
    for (const [index, input] of transferAction.abiDefinition.inputs.entries()) {
      await waitFor(() => {
        expect(screen.queryByTestId(`generated-function-to-call-${index}-error`)).not.toBeInTheDocument()
      })
    }
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/content")
    })
  }) // renders correctly - show error if fields are not filled

  it("renders correctly - proceed correctly on submit  as calldata is already available", async () => {
    const mockSetData = vi.fn()
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Title",
      shortDescription: "Description",
      markdownDescription: "fffd",
      actions: [transferAction],
      setData: mockSetData,
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
      </FormProposalLayout>,
    )

    await screen.findByText("What is your proposal about?")
    await screen.findByText("Basic information")
    const continueButton = await screen.findByTestId("continue")
    const goBack = await screen.findByTestId("go-back")

    await screen.findByTestId("proposal-actions-container")
    await screen.findByText("Executable functions")
    const field = await screen.findByTestId(
      `executable-card-${0}-${transferAction.contractAddress}-${transferAction.name}`,
    )
    expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).not.toBeInTheDocument()
    fireEvent.click(goBack)
    expect(mockBack).toHaveBeenCalled()

    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).not.toBeInTheDocument()
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/content")
    })
  }) // renders correctly - proceed correctly as calldata is already available

  it("renders correctly - can add and remove another transaction", async () => {
    const mockSetData = vi.fn()
    spyOnUseProposalFormStore.mockReturnValue({
      title: "Title",
      shortDescription: "Description",
      markdownDescription: "fffd",
      actions: [transferAction],
      setData: mockSetData,
    })
    const component = render(
      <FormProposalLayout>
        <NewProposalFunctionsDetails />
      </FormProposalLayout>,
    )

    await screen.findByText("What is your proposal about?")
    await screen.findByText("Basic information")
    const continueButton = await screen.findByTestId("continue")
    const goBack = await screen.findByTestId("go-back")

    await screen.findByTestId("proposal-actions-container")
    await screen.findByText("Executable functions")
    const field = await screen.findByTestId(
      `executable-card-${0}-${transferAction.contractAddress}-${transferAction.name}`,
    )
    expect(
      screen.queryByTestId(`executable-card-${1}-${transferAction.contractAddress}-${transferAction.name}`),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).not.toBeInTheDocument()
    const addAnotherTx = await screen.findByTestId(
      `executable-card-${0}-${transferAction.contractAddress}-${transferAction.name}__add-another-tx`,
    )
    fireEvent.click(addAnotherTx)

    await waitFor(async () => {
      expect(
        screen.queryByTestId(`executable-card-${1}-${transferAction.contractAddress}-${transferAction.name}`),
      ).toBeInTheDocument()
      const removeTx = await screen.findByTestId(
        `executable-card-${1}-${transferAction.contractAddress}-${transferAction.name}__remove-tx`,
      )
      fireEvent.click(removeTx)
    })

    await waitFor(async () => {
      expect(
        screen.queryByTestId(`executable-card-${1}-${transferAction.contractAddress}-${transferAction.name}`),
      ).not.toBeInTheDocument()
    })

    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(screen.queryByTestId(`generated-function-to-call-${0}-error`)).not.toBeInTheDocument()
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/content")
    })
  }) // renders correctly - proceed correctly as calldata is already available
})
