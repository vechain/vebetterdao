import { fireEvent, render, screen } from "../../../../../test"
import { AllocationRoundHeaderCard } from "./AllocationRoundHeaderCard"
import * as apiHooks from "../../../../api"
import * as dappKit from "@vechain/dapp-kit-react"
import dayjs from "dayjs"
import { APPS } from "../../../../../test/mocks/Apps"
import { ethers } from "ethers"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const spyOnUserAllocationRound = vi.spyOn(apiHooks, "useAllocationsRound")
const spyOnUserAllocationRoundState = vi.spyOn(apiHooks, "useAllocationsRoundState")
const spyOnHasVotedInRound = vi.spyOn(apiHooks, "useHasVotedInRound")
const spyOnUserVotesInRound = vi.spyOn(apiHooks, "useUserVotesInRound")
const spyOnRoundXApps = vi.spyOn(apiHooks, "useRoundXApps")

type TestPageRenderParams = {
  roundId: string
  shouldRenderCastButton: boolean
  shouldRenderVotesBox?: boolean
  userTotalVotes?: number
  voteEndTimestamp: dayjs.Dayjs
}
const compactFormatter = getCompactFormatter()
const testPageRender = async ({
  roundId,
  shouldRenderCastButton,
  shouldRenderVotesBox = true,
  userTotalVotes,
  voteEndTimestamp,
}: TestPageRenderParams) => {
  const isRoundFinished = dayjs().isAfter(voteEndTimestamp)

  await screen.findByTestId("allocation-round-header-card")
  await screen.findByTestId("allocation-round-breakdown-chart")

  await screen.findByText(`Round #${roundId}`)
  await screen.findByText(`Allocations`)
  if (shouldRenderVotesBox) {
    await screen.findByTestId(`your-vote-box`)
    if (userTotalVotes !== undefined) {
      const renderedText = compactFormatter.format(userTotalVotes)
      await screen.findByText(renderedText)
    } else {
      await screen.findByText("You have not voted")
    }
  } else {
    expect(screen.queryByTestId(`your-vote-box`)).not.toBeInTheDocument()
  }
  if (shouldRenderCastButton) {
    const castButton = await screen.findByTestId(`cast-your-vote-button`)
    fireEvent.click(castButton)
    //TODO: check router called after vote flow refactor
  } else {
    expect(screen.queryByTestId(`cast-your-vote-button`)).not.toBeInTheDocument()
  }

  await screen.findByText(
    "Vote for your preferred app to determine funding from the Apps allocation budget. More votes mean more funding. Plus, earn rewards from the Voting Rewards allocation by voting in this round. This allocation process repeats every week.",
  )
  await screen.findByText("Participating")
  await screen.findByText(`${APPS.length} apps`)

  if (isRoundFinished) {
    const remainingTime = voteEndTimestamp.fromNow()
    await screen.findByText("Finished")
    await screen.findByText(remainingTime)
  } else {
    const remainingTime = voteEndTimestamp.fromNow(true)
    await screen.findByText("Finishes in")
    await screen.findByText(remainingTime)
  }
}
describe("AllocationRoundHeaderCard", () => {
  const roundId = "1"
  const votEndToFinishTimestamp = dayjs().add(1, "day")
  const voteFinishedTimestamp = dayjs().subtract(1, "day")
  const totalVotesCast = 20000
  beforeEach(() => {
    //@ts-ignore
    spyOnUserAllocationRound.mockReturnValue({
      data: {
        voteEndTimestamp: dayjs().add(1, "day"),
        voteStartTimestamp: dayjs().subtract(1, "day"),
        appsIds: [],
        isCurrent: true,
        proposer: "0x123",
        roundId,
        state: 0,
        voteEnd: "125",
        voteStart: "120",
      },
      isLoading: false,
    })
    //@ts-ignore
    spyOnUserAllocationRoundState.mockReturnValue({
      data: 0,
      isLoading: false,
    })
    //@ts-ignore
    spyOnHasVotedInRound.mockReturnValue({
      data: true,
      isLoading: false,
    })
    //@ts-ignore
    spyOnUserVotesInRound.mockReturnValue({
      data: {
        voteWeights: [ethers.parseEther(totalVotesCast.toString()).toString()],
        appsIds: [APPS[0]?.id as string],
        roundId,
        voter: "0x123",
      },
      isLoading: false,
    })
    //@ts-ignore
    spyOnRoundXApps.mockReturnValue({
      data: APPS,
      isLoading: false,
    })

    vi.useFakeTimers()
    vi.setSystemTime(dayjs().valueOf())
  }) // beforeEach

  afterEach(() => {
    vi.useRealTimers()
  }) // afterEach

  it("no account - should render correctly", async () => {
    //@ts-ignore
    vi.spyOn(dappKit, "useWallet").mockReturnValueOnce({
      account: null,
    })
    render(<AllocationRoundHeaderCard roundId={roundId} />)

    testPageRender({
      roundId,
      shouldRenderCastButton: false,
      shouldRenderVotesBox: false,
      voteEndTimestamp: votEndToFinishTimestamp,
    })
  }) //no account - should render correctly

  describe("round not finished", () => {
    it("user voted - renders correctly", async () => {
      render(<AllocationRoundHeaderCard roundId={roundId} />)

      testPageRender({
        roundId,
        shouldRenderCastButton: false,
        userTotalVotes: totalVotesCast,
        voteEndTimestamp: votEndToFinishTimestamp,
      })
    }) //no account - should render correctly

    it("no votes - renders correctly", async () => {
      //@ts-ignore
      spyOnHasVotedInRound.mockReturnValue({
        data: false,
        isLoading: false,
      })
      render(<AllocationRoundHeaderCard roundId={roundId} />)

      testPageRender({
        roundId,
        shouldRenderCastButton: true,
        userTotalVotes: totalVotesCast,
        voteEndTimestamp: votEndToFinishTimestamp,
      })
    }) //no account - should render correctly
  }) //round not finished

  describe("round finished", () => {
    it("user voted - renders correctly", async () => {
      render(<AllocationRoundHeaderCard roundId={roundId} />)

      testPageRender({
        roundId,
        shouldRenderCastButton: false,
        userTotalVotes: totalVotesCast,
        voteEndTimestamp: voteFinishedTimestamp,
      })
    }) //no account - should render correctly

    it("no votes - renders correctly", async () => {
      render(<AllocationRoundHeaderCard roundId={roundId} />)

      testPageRender({
        roundId,
        shouldRenderCastButton: false,
        voteEndTimestamp: voteFinishedTimestamp,
      })
    }) //no account - should render correctly
  }) //round finished
}) // AllocationRoundHeaderCard
