import { render } from "../../../../../test"
import * as apiHooks from "../../../../api"
import * as dappkit from "@vechain/dapp-kit-react"
import { AllocationRoundUserVotes } from "./AllocationRoundUserVotes"

const address = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa"
const APPS: apiHooks.XApp[] = [
  {
    id: "1",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "Vyvo",
    metadataURI: "bafkreigk7faih4jmdee4ritah6564jqpfn5s2gl4dcsvii7woijy5ls7ca",
  },
  {
    id: "2",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "Mugshot",
    metadataURI: "bafkreicglvjxjy2yxruwpmu6czm5th76bauu5phfhnlf2oxbyc66fdrzkm",
  },
  {
    id: "3",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "Cleanify",
    metadataURI: "bafkreicw6g34t3th63z7hq3o4xkay6dkrei5ny5evyrlclw53gfz6o6lgu",
  },
  {
    id: "4",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "Non Fungible Book Club (NFBC)",
    metadataURI: "bafkreicdcol6afcsfb4efxmjzqsuonukn54jixmfqmfsirhw4wujvxfpxy",
  },
  {
    id: "5",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "Green Ambassador Challenge",
    metadataURI: "bafkreigrwjowwwcmdd7bdm3yqsquu77ufeqcao6mjbd2fednwo5qfmtldi",
  },
  {
    id: "6",
    createdAtTimestamp: 1630000000,
    receiverAddress: address,
    name: "GreenCart",
    metadataURI: "bafkreie6gdx7xugiemmubpfb6r5c4bdwfjucjtmb43mk2fhemyx3x3kvnu",
  },
]

vi.mock("@vechain/dapp-kit-react", async importOriginal => {
  const mod = await importOriginal<typeof import("@vechain/dapp-kit-react")>()
  return {
    ...mod,
    useWallet: () => ({
      account: null,
    }),
  }
})

beforeEach(() => {
  //@ts-ignore
  vi.spyOn(apiHooks, "useRoundXApps").mockReturnValue({
    data: APPS,
    isLoading: false,
    isError: false,
  })
})

describe("AllocationRoundUserVotes", () => {
  const roundId = "1"

  it("wallet not connected - should render correctly", async () => {
    //mock dappkit

    const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

    await screen.findByTestId("wallet-not-connected-overlay")
    await screen.findByText("Connect your wallet to cast your vote!")
  })

  it("wallet connected - apps available - should render correctly", async () => {
    //@ts-ignore
    vi.spyOn(dappkit, "useWallet").mockReturnValue({
      account: address,
    })
    const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

    expect(screen.queryByTestId("wallet-not-connected-overlay")).not.toBeInTheDocument()
    expect(screen.queryByText("Connect your wallet to cast your vote!")).not.toBeInTheDocument()

    for (const app of APPS) {
      await screen.findByTestId(`${app.name}-vote-input`)
    }
  })
})
