import { fireEvent, render, waitFor } from "@testing-library/react"
import NewProposalFunctions from "./page"
import FormProposalLayout from "../layout"
import * as store from "@/store"
import * as router from "next/navigation"
import * as vechainKit from "@vechain/vechain-kit"
import { screen } from "../../../../../../test"
import { getEnvWhitelistedContractsWithFunctions } from "@/constants"
import { vi } from "vitest"
import { EnvConfig, AppEnv } from "@repo/config/contracts"
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

vi.spyOn(router, "usePathname").mockImplementation(() => "/proposals/new/form/functions")

const checkCardContractsRendered = async (env: EnvConfig, clickFunctions = false, doubleClickFunctions = false) => {
  render(
    <FormProposalLayout>
      <NewProposalFunctions />
    </FormProposalLayout>,
  )
  if (env !== "testnet") {
    await screen.findByTestId("dev__select_env")
  } else {
    expect(screen.queryByTestId("dev__select_env")).not.toBeInTheDocument()
  }

  await screen.findByText("What is your proposal about?")
  await screen.findByText(
    "Proposals are based on smart contracts that will be executed. Select the action that you proposal will trigger if succeed in the voting session.",
  )

  expect(screen.queryByText("Please select at least one function")).not.toBeInTheDocument()
  const goBackButton = await screen.findByTestId("go-back")
  fireEvent.click(goBackButton)
  expect(mockBack).toHaveBeenCalled()

  const contractsWithFunctionsToRender = getEnvWhitelistedContractsWithFunctions(env)
  const functionsNumber = contractsWithFunctionsToRender.reduce((acc, contract) => acc + contract.functions.length, 0)
  // list of functions
  for (const contract of contractsWithFunctionsToRender) {
    for (const func of contract.functions) {
      if (functionsNumber > 3) {
        expect(screen.queryByTestId(`checkable-card__${func.name}`)).not.toBeInTheDocument()
        const functionCard = screen.queryByTestId(`function-card__${contract.name}_${func.name}`)
        clickFunctions && fireEvent.click(functionCard as Element)
        doubleClickFunctions && fireEvent.click(functionCard as Element)
        expect(functionCard).toBeInTheDocument()
      } else {
        const functionCard = screen.queryByTestId(`checkable-card__${func.name}`)
        expect(functionCard).toBeInTheDocument()
        clickFunctions && fireEvent.click(functionCard as Element)
        doubleClickFunctions && fireEvent.click(functionCard as Element)
        expect(screen.queryByTestId(`function-card__${contract.name}_${func.name}`)).not.toBeInTheDocument()
      }
    }
  }

  const continueButton = await screen.findByTestId("continue")
  fireEvent.click(continueButton)
  await waitFor(() => {
    if (!clickFunctions || doubleClickFunctions) {
      expect(mockRouterPush).not.toHaveBeenCalled()
      expect(screen.queryByText("Please select at least one function")).toBeInTheDocument()
    } else {
      expect(mockRouterPush).toHaveBeenCalledWith("/proposals/new/form/functions/details")
      expect(screen.queryByText("Please select at least one function")).not.toBeInTheDocument()
    }
  })
}

describe("NewProposalDiscussion", async () => {
  beforeEach(() => {
    vi.clearAllMocks()
    spyOnUseProposalFormStore.mockClear()
  })

  it("redirects to /proposals if no account connected", async () => {
    //@ts-ignore
    vi.spyOn(vechainKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(
      <FormProposalLayout>
        <NewProposalFunctions />
      </FormProposalLayout>,
    )

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith("/proposals"))
  }) // redirects to /proposals if no account connected

  describe("testnet-staging", () => {
    it("no functions selected - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet-staging")

      await checkCardContractsRendered(AppEnv.TESTNET_STAGING)
    }) // no functions selected - clicks continue - error is showed

    it("all functions selected - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet-staging")

      await checkCardContractsRendered(AppEnv.TESTNET_STAGING, true)
    }) // all functions selected - clicks continue - error is showed

    it("add and remove all functions - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet-staging")

      await checkCardContractsRendered(AppEnv.TESTNET_STAGING, true, true)
    }) //add and remove all functions - clicks continue - error is showed
  }) //testnet-staging

  describe("testnet", () => {
    it("no functions selected - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet")

      await checkCardContractsRendered("testnet")
    }) // no functions selected - clicks continue - error is showed

    it("all functions selected - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet")

      await checkCardContractsRendered("testnet", true)
    }) //all functions selected - clicks continue - error is showed

    it("add and remove all functions - clicks continue - error is showed", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "testnet")

      await checkCardContractsRendered("testnet", true, true)
    }) //add and remove all functions - clicks continue - error is showed
  }) //testnet
})
