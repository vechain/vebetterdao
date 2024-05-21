import { fireEvent, render, waitFor } from "../../../../../test"
import * as apiHooks from "../../../../api"
import * as dappkit from "@vechain/dapp-kit-react"
import * as hooks from "../../../../hooks"
import { AllocationRoundUserVotes } from "./AllocationRoundUserVotes"
import { APPS } from "../../../../../test/mocks/Apps"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { scaledDivision } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"

const address = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa"

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

  describe("wallet connected", () => {
    beforeEach(() => {
      //@ts-ignore
      vi.spyOn(dappkit, "useWallet").mockReturnValue({
        account: address,
      })
    })
    it("apps available - should render correctly", async () => {
      const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

      expect(screen.queryByTestId("wallet-not-connected-overlay")).not.toBeInTheDocument()
      expect(screen.queryByText("Connect your wallet to cast your vote!")).not.toBeInTheDocument()

      for (const app of APPS) {
        await screen.findByTestId(`${app.name}-vote-input`)
      }
    })
    it("apps not available - should render correctly", async () => {
      //@ts-ignore
      vi.spyOn(apiHooks, "useRoundXApps").mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      })
      const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

      expect(screen.queryByTestId("wallet-not-connected-overlay")).not.toBeInTheDocument()
      expect(screen.queryByText("Connect your wallet to cast your vote!")).not.toBeInTheDocument()

      for (const app of APPS) {
        expect(screen.queryByTestId(`${app.name}-vote-input`)).not.toBeInTheDocument()
      }
    })
    describe("voting active", () => {
      const totalVotes = "100"
      const randomAppsExcludedId = APPS.filter(() => Math.random() > 0.5).map(app => app.id)
      const appsVoted = APPS.filter(app => !randomAppsExcludedId.includes(app.id))
      beforeEach(() => {
        // tell vitest we use mocked time
        vi.useFakeTimers()
        vi.setSystemTime(dayjs().valueOf())
        //@ts-ignore
        vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
          data: {
            voteEndTimestamp: dayjs().add(1, "day"),
            voteStartTimestamp: dayjs().subtract(2, "day"),
            appsIds: APPS.filter(app => !randomAppsExcludedId.includes(app.id)).map(app => app.id),
            isCurrent: true,
            proposer: "0x123",
            voteStart: "1",
            voteEnd: "2",
            roundId: "1",
            state: "1",
          },
          isLoading: false,
          isError: false,
        })

        //@ts-ignore
        vi.spyOn(apiHooks, "useGetVotesOnBlock").mockReturnValue({
          data: {
            formatted: totalVotes,
            original: ethers.parseEther(totalVotes).toString(),
            scaled: totalVotes,
          },
          isLoading: false,
          isError: false,
        })
      })
      afterEach(() => {
        // restoring date after each test run
        vi.useRealTimers()
      })

      describe("user has not voted", () => {
        const mockSendtransaction = vi.fn()
        beforeEach(() => {
          //@ts-ignore
          vi.spyOn(apiHooks, "useUserVotesInRound").mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
          })

          //@ts-ignore
          vi.spyOn(apiHooks, "useHasVotedInRound").mockReturnValue({
            data: false,
            isLoading: false,
            isError: false,
          })
          vi.spyOn(hooks, "useCastAllocationVotes").mockReturnValue({
            sendTransaction: mockSendtransaction,
            resetStatus: vi.fn(),
            status: "ready",
            isTxReceiptLoading: false,
            sendTransactionError: null,
            sendTransactionPending: false,
            sendTransactionTx: null,
            txReceipt: null,
            txReceiptError: null,
            error: undefined,
          })
        })
        it("has votes to cast - should render correctly", async () => {
          const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

          expect(await screen.findByText("Assign voting power to apps")).toBeInTheDocument()
          expect(
            await screen.findByText(
              "Distribute your voting power among your selected apps to help them receive more B3TR allocation.",
            ),
          ).toBeInTheDocument()
          expect(await screen.findByText("Available apps")).toBeInTheDocument()
          expect(await screen.findByText("Voting power to distribute")).toBeInTheDocument()

          expect(await screen.findByTestId("split-evenly")).toBeInTheDocument()
          expect(await screen.findByTestId("cast-vote-button")).toBeInTheDocument()

          for (const app of APPS) {
            const input = await screen.findByTestId(`${app.name}-vote-input`)
            expect(input).toBeEnabled()
          }
        })
        it("no votes to cast - should render correctly", async () => {
          //@ts-ignore
          vi.spyOn(apiHooks, "useGetVotesOnBlock").mockReturnValue({
            data: {
              formatted: "0",
              original: "0",
              scaled: "0",
            },
            isLoading: false,
            isError: false,
          })
          const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

          expect(await screen.findByText("Assign voting power to apps")).toBeInTheDocument()
          expect(
            await screen.findByText(
              "Distribute your voting power among your selected apps to help them receive more B3TR allocation.",
            ),
          ).toBeInTheDocument()
          expect(await screen.findByText("Available apps")).toBeInTheDocument()
          expect(await screen.findByText("Voting power to distribute")).toBeInTheDocument()

          expect(await screen.findByTestId("split-evenly")).toBeInTheDocument()
          const castButton = await screen.findByTestId("cast-vote-button")
          expect(castButton).toBeDisabled()

          for (const app of APPS) {
            const input = await screen.findByTestId(`${app.name}-vote-input`)
            expect(input).toBeDisabled()
          }
          await screen.findByTestId("no-votes-label")
        })
        it("splitEvenly", async () => {
          const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

          const splitEvenly = await screen.findByTestId("split-evenly")
          fireEvent.click(splitEvenly)
          const votesPerApp = scaledDivision(Number(totalVotes), APPS.length)
          const humanValue = new BigNumber(votesPerApp).toFixed(2, BigNumber.ROUND_HALF_DOWN)
          const castButton = await screen.findByTestId("cast-vote-button")
          expect(castButton).toBeEnabled()

          for (const app of APPS) {
            const input = await screen.findByTestId(`${app.name}-vote-input`)
            expect(input).toBeEnabled()
            expect(input).toHaveValue(humanValue)
            expect(screen.queryByTestId(`app-${app.name}-vote-error`)).not.toBeInTheDocument()
            await screen.findByTestId(`${app.name}-vote-estimated-votes`)
          }
          expect(castButton).toBeEnabled()
          fireEvent.submit(castButton)
          await waitFor(() => {
            for (const app of APPS) {
              //no errors
              expect(screen.queryByTestId(`app-${app.name}-vote-error`)).not.toBeInTheDocument()
              expect(screen.queryByTestId(`${app.name}-vote-estimated-votes`)).toBeInTheDocument()
            }
          })
          //   //TODO: not being able to detect this
          //   await waitFor(() => {
          //     expect(mockSendtransaction).toHaveBeenCalledWith({
          //       votes: APPS.map(app => ({ appId: app.id, value: votesPerApp })),
          //       roundId,
          //     })
          //   })
        })
        describe("manual votes", () => {
          it("all-in on a single app - works", async () => {
            const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

            const castButton = await screen.findByTestId("cast-vote-button")
            expect(castButton).toBeEnabled()

            const randomApp = APPS[Math.floor(Math.random() * APPS.length)]
            if (!randomApp) throw new Error("randomApp is undefined")

            const input = await screen.findByTestId(`${randomApp.name}-vote-input`)
            expect(input).toBeEnabled()

            expect(screen.queryByTestId(`app-${randomApp.id}-vote-100`)).not.toBeInTheDocument()
            await screen.findByText("0.00% distributed")
            fireEvent.input(input, { target: { value: 100 } })
            expect(input).toHaveValue("100")

            //AppVotesBreakdown updates correctly
            await screen.findByTestId(`app-${randomApp.id}-vote-100`)
            await screen.findByText("100.00% distributed")

            fireEvent.submit(castButton)

            //no errors
            await waitFor(() => {
              expect(screen.queryByTestId(`app-${randomApp.name}-vote-error`)).not.toBeInTheDocument()
              expect(screen.queryByTestId(`${randomApp.name}-vote-estimated-votes`)).toBeInTheDocument()
            })
          }) // all-in on a single app - works
          it("voting random apps < 100 - works", async () => {
            const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

            const castButton = await screen.findByTestId("cast-vote-button")
            expect(castButton).toBeEnabled()
            const votesPerApp = "10"
            for (const [index, app] of appsVoted.entries()) {
              const input = await screen.findByTestId(`${app.name}-vote-input`)
              expect(input).toBeEnabled()
              expect(screen.queryByTestId(`app-${app.id}-vote-${votesPerApp}`)).not.toBeInTheDocument()
              const currentVotes = index * Number(votesPerApp)
              await screen.findByText(`${currentVotes.toFixed(2)}% distributed`)
              fireEvent.input(input, { target: { value: votesPerApp } })
              expect(input).toHaveValue(votesPerApp)

              //AppVotesBreakdown updates correctly
              await screen.findByTestId(`app-${app.id}-vote-${votesPerApp}`)

              //total distrivbuted increment gradually
              const votes = (index + 1) * Number(votesPerApp)
              await screen.findByText(`${votes.toFixed(2)}% distributed`)
            }
            fireEvent.click(castButton)
            await waitFor(() => {
              for (const app of appsVoted) {
                //no errors
                expect(screen.queryByTestId(`app-${app.name}-vote-error`)).not.toBeInTheDocument()
                expect(screen.queryByTestId(`${app.name}-vote-estimated-votes`)).toBeInTheDocument()
              }
            })
          }) // voting random apps < 100 - works
          it("voting random apps > 100 - render errors", async () => {
            const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

            const castButton = await screen.findByTestId("cast-vote-button")
            expect(castButton).toBeEnabled()
            const votesPerApp = "50"
            for (const [index, app] of APPS.entries()) {
              const input = await screen.findByTestId(`${app.name}-vote-input`)
              expect(input).toBeEnabled()
              expect(screen.queryByTestId(`app-${app.id}-vote-${votesPerApp}`)).not.toBeInTheDocument()
              const currentVotes = index * Number(votesPerApp)
              await screen.findByText(`${currentVotes.toFixed(2)}% distributed`)
              fireEvent.input(input, { target: { value: votesPerApp } })
              expect(input).toHaveValue(votesPerApp)

              //no errors
              expect(screen.queryByTestId(`app-${app.name}-vote-error`)).not.toBeInTheDocument()
              await screen.findByTestId(`${app.name}-vote-estimated-votes`)

              //AppVotesBreakdown updates correctly
              await screen.findByTestId(`app-${app.id}-vote-${votesPerApp}`)

              //total distrivbuted increment gradually
              const votes = (index + 1) * Number(votesPerApp)
              await screen.findByText(`${votes.toFixed(2)}% distributed`)
            }
            fireEvent.submit(castButton)

            //render errors for all fields
            await waitFor(() => {
              for (const app of APPS) {
                expect(screen.queryByTestId(`${app.name}-vote-error`)).toBeInTheDocument()
                expect(screen.queryByTestId(`${app.name}-vote-estimated-votes`)).not.toBeInTheDocument()
              }
            })
          }) // voting random apps < 100 - works
        }) //manual votes
      }) // user has not voted
      it("user has voted - should render correctly", async () => {
        //@ts-ignore
        vi.spyOn(apiHooks, "useHasVotedInRound").mockReturnValue({
          data: true,
          isLoading: false,
          isError: false,
        })

        const votesPerApp = "10"
        //@ts-ignore
        vi.spyOn(apiHooks, "useUserVotesInRound").mockReturnValue({
          data: {
            appsIds: appsVoted.map(app => app.id),
            roundId: "1",
            voteWeights: appsVoted.map(app => ethers.parseEther(votesPerApp).toString()),
            voter: address,
          },
          isLoading: false,
          isError: false,
        })

        const totalVotesCast = appsVoted.length * Number(votesPerApp)
        const screen = render(<AllocationRoundUserVotes roundId={roundId} />)
        const percentageDistributed = scaledDivision(totalVotesCast * 100, Number(totalVotes))

        expect(await screen.findByText("Your voting distribution")).toBeInTheDocument()
        expect(
          await screen.findByText(
            "You have already cast your vote. See below the distribution of your voting power among the apps.",
          ),
        ).toBeInTheDocument()

        // test percentageDistributed

        expect(await screen.findByText("Voted apps")).toBeInTheDocument()

        expect(await screen.findByText("Distributed voting power")).toBeInTheDocument()

        expect(screen.queryByTestId("split-evenly")).not.toBeInTheDocument()
        expect(screen.queryByTestId("cast-vote-button")).not.toBeInTheDocument()

        for (const app of APPS) {
          const isExcluded = randomAppsExcludedId.includes(app.id)
          if (!isExcluded) {
            // inputs
            const input = await screen.findByTestId(`${app.name}-vote-input`)
            expect(input).toBeDisabled()
            const rawValue = scaledDivision(Number(votesPerApp) * 100, Number(totalVotes))
            const humanValue = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)
            expect(input).toHaveValue(humanValue)

            //votesbreakdown
            await screen.findByTestId(`app-${app.id}-vote-${humanValue}`)
          } else {
            const input = screen.queryByTestId(`${app.name}-vote-input`)
            expect(input).not.toBeInTheDocument()

            expect(screen.queryByTestId(`app-${app.id}-vote-${"10.00"}`)).not.toBeInTheDocument()
          }
        }
      })
    }) // voting active

    describe("voting concluded", () => {
      const totalVotes = "100"
      const randomAppsExcludedId = APPS.filter(() => Math.random() > 0.5).map(app => app.id)
      const appsVoted = APPS.filter(app => !randomAppsExcludedId.includes(app.id))
      beforeEach(() => {
        // tell vitest we use mocked time
        vi.useFakeTimers()
        vi.setSystemTime(dayjs().valueOf())
        //@ts-ignore
        vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
          data: {
            voteEndTimestamp: dayjs().subtract(1, "day"),
            voteStartTimestamp: dayjs().subtract(2, "day"),
            appsIds: APPS.filter(app => !randomAppsExcludedId.includes(app.id)).map(app => app.id),
            isCurrent: true,
            proposer: "0x123",
            voteStart: "1",
            voteEnd: "2",
            roundId: "1",
            state: "1",
          },
          isLoading: false,
          isError: false,
        })

        //@ts-ignore
        vi.spyOn(apiHooks, "useGetVotesOnBlock").mockReturnValue({
          data: {
            formatted: totalVotes,
            original: ethers.parseEther(totalVotes).toString(),
            scaled: totalVotes,
          },
          isLoading: false,
          isError: false,
        })
      })
      afterEach(() => {
        // restoring date after each test run
        vi.useRealTimers()
      })

      it("user has not voted - should render correctly", async () => {
        //@ts-ignore
        vi.spyOn(apiHooks, "useHasVotedInRound").mockReturnValue({
          data: false,
          isLoading: false,
          isError: false,
        })
        //@ts-ignore
        vi.spyOn(apiHooks, "useUserVotesInRound").mockReturnValue({
          data: null,
          isLoading: false,
          isError: false,
        })
        const screen = render(<AllocationRoundUserVotes roundId={roundId} />)

        expect(await screen.findByText("Voting concluded")).toBeInTheDocument()
        expect(
          await screen.findByText("Voting is concluded. You can no longer cast your vote. No votes were cast."),
        ).toBeInTheDocument()
        expect(await screen.findByText("Available apps")).toBeInTheDocument()
        expect(await screen.findByText("Distributed voting power")).toBeInTheDocument()

        expect(screen.queryByTestId("split-evenly")).not.toBeInTheDocument()
        expect(screen.queryByTestId("cast-vote-button")).not.toBeInTheDocument()

        for (const app of APPS) {
          const input = await screen.findByTestId(`${app.name}-vote-input`)
          expect(input).toBeDisabled()
        }
      })
      it("user has voted - should render correctly", async () => {
        //@ts-ignore
        vi.spyOn(apiHooks, "useHasVotedInRound").mockReturnValue({
          data: true,
          isLoading: false,
          isError: false,
        })

        const votesPerApp = "10"
        //@ts-ignore
        vi.spyOn(apiHooks, "useUserVotesInRound").mockReturnValue({
          data: {
            appsIds: appsVoted.map(app => app.id),
            roundId: "1",
            voteWeights: appsVoted.map(app => ethers.parseEther(votesPerApp).toString()),
            voter: address,
          },
          isLoading: false,
          isError: false,
        })

        const totalVotesCast = appsVoted.length * Number(votesPerApp)
        const screen = render(<AllocationRoundUserVotes roundId={roundId} />)
        const percentageDistributed = scaledDivision(totalVotesCast * 100, Number(totalVotes))

        expect(await screen.findByText("Voting concluded")).toBeInTheDocument()
        expect(
          await screen.findByText(
            "Voting is concluded. See below the distribution of your voting power among the apps.",
          ),
        ).toBeInTheDocument()

        // test percentageDistributed

        expect(
          await screen.findByText(`${getCompactFormatter().format(totalVotesCast)} votes cast`),
        ).toBeInTheDocument()
        expect(await screen.findByText("Voted apps")).toBeInTheDocument()
        expect(await screen.findByText("Distributed voting power")).toBeInTheDocument()

        expect(screen.queryByTestId("split-evenly")).not.toBeInTheDocument()
        expect(screen.queryByTestId("cast-vote-button")).not.toBeInTheDocument()

        for (const app of appsVoted) {
          const isExcluded = randomAppsExcludedId.includes(app.id)
          if (!isExcluded) {
            // inputs
            const input = await screen.findByTestId(`${app.name}-vote-input`)
            expect(input).toBeDisabled()
            const rawValue = scaledDivision(Number(votesPerApp) * 100, Number(totalVotes))
            const humanValue = new BigNumber(rawValue).toFixed(2, BigNumber.ROUND_HALF_DOWN)
            expect(input).toHaveValue(humanValue)

            //votesbreakdown
            await screen.findByTestId(`app-${app.id}-vote-${humanValue}`)
          } else {
            const input = screen.queryByTestId(`${app.name}-vote-input`)
            expect(input).not.toBeInTheDocument()

            expect(screen.queryByTestId(`app-${app.id}-vote-${"10.00"}`)).not.toBeInTheDocument()
          }
        }
      })
    }) // voting concluded
  })
})
