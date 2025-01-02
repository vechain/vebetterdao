import { expect, test } from "vitest"
import AllocationDetail from "./page"
import { render, screen } from "../../../../test"

import * as hooks from "@/api"
import dayjs from "dayjs"

test("Allocations", async () => {
  const roundId = "1"
  //@ts-ignore
  vi.spyOn(hooks, "useAllocationsRoundState").mockReturnValue({
    data: 0,
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useHasVotedInRound").mockReturnValue({
    data: true,
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useAllocationsRound").mockReturnValue({
    data: {
      voteStartTimestamp: dayjs(),
      voteEndTimestamp: dayjs(),
      isFirstRound: false,
      isLastRound: false,
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useUserVotesInRound").mockReturnValue({
    data: {
      voter: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      roundId: "1",
      appsIds: ["0x123"],
      voteWeights: ["1"],
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useGetVotesOnBlock").mockReturnValue({
    data: "1",
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useRoundReward").mockReturnValue({
    data: {
      roundId: "1",
      rewards: "1",
    },
    isLoading: false,
    isError: false,
  })

  const activeApps = [
    {
      id: "1",
      name: "Test Active App",
      teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      createdAtTimestamp: "16347455",
      metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
    },
  ]
  //@ts-ignore
  vi.spyOn(hooks, "useXApps").mockReturnValue({
    data: {
      active: activeApps,
      unendorsed: [],
      allApps: activeApps,
      endorsed: activeApps,
    },
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(hooks, "useXAppRoundEarnings").mockReturnValue({
    data: {
      amount: "1",
      xAppId: "1",
    },
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(hooks, "useRoundAppVotes").mockReturnValue({
    data: [
      {
        appId: "1",
        voters: 1,
        roundId: 0,
        totalVotes: "1",
      },
    ],
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(hooks, "useXAppMetadata").mockReturnValue({
    data: {
      logo: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
      name: "",
      description: "",
      external_url: "",
      banner: "",
      screenshots: [],
      social_urls: [],
      app_urls: [],
      tweets: [],
      ve_world: {
        banner: "",
      },
    },
    isLoading: false,
    error: null,
  })
  render(
    <AllocationDetail
      params={{
        roundId,
      }}
    />,
  )
  expect(await screen.findByTestId(`allocation-${roundId}-page`)).toBeInTheDocument()
  expect(await screen.findByTestId(`allocation-round-header-card`)).toBeInTheDocument()
})
