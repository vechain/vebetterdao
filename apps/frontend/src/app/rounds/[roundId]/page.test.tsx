import dayjs from "dayjs"
import { expect, test } from "vitest"

import * as apiHooks from "@/api"

import { render, screen } from "../../../../test"

import AllocationDetail from "./page"

test("Allocations", async () => {
  const roundId = "1"
  //@ts-ignore
  vi.spyOn(apiHooks, "useAllocationsRoundState").mockReturnValue({
    data: 0, //Active
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useHasVotedInRound").mockReturnValue({
    data: true, //Has voted
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useAccountLinking").mockReturnValue({
    isLinked: false,
    isLoading: false,
    passport: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
    isPassport: true,
    isEntity: false,
    passportLinkedEntities: [],
    incomingPendingLinkings: [],
    outgoingPendingLink: undefined,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useUserDelegation").mockReturnValue({
    delegator: undefined,
    delegatee: undefined,
    isLoading: false,
    isDelegator: false,
    isDelegatee: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useCanUserVote").mockReturnValue({
    data: true,
    hasVotesAtSnapshot: true,
    isLoading: false,
    isPerson: true,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useAllocationsRound").mockReturnValue({
    data: {
      state: 0, //Active
      isCurrent: false,
      roundId,
      appsIds: ["0x123"],
      proposer: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      voteStartTimestamp: dayjs(),
      voteEndTimestamp: dayjs(),
      isFirstRound: false,
      isLastRound: false,
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useUserVotesInRound").mockReturnValue({
    data: {
      voter: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      roundId,
      appsIds: ["0x123"],
      voteWeights: ["1"],
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useGetVotesOnBlock").mockReturnValue({
    data: "110",
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useRoundReward").mockReturnValue({
    data: {
      roundId,
      rewards: "1",
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useAllocationVotes").mockReturnValue({
    data: "110",
    status: "success",
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useAllocationRoundQuorum").mockReturnValue({
    data: "100",
    status: "success",
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useVot3PastSupply").mockReturnValue({
    data: "1000",
    status: "success",
    isLoading: false,
    isError: false,
  })

  const activeApps = [
    {
      id: "0x123",
      name: "Test Active App",
      teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      createdAtTimestamp: "16347455",
      metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQmQm",
      isNew: false,
    },
  ]

  const unendorsedApps = [
    {
      id: "0x321",
      name: "Test Unendorsed App",
      teamWalletAddress: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
      createdAtTimestamp: "0",
      metadataURI: "ipfs://QmQmQmQmQmQmQmQmQmQmQmQmQmQm",
      isNew: false,
      appAvailableForAllocationVoting: false,
    },
  ]
  //@ts-ignore
  vi.spyOn(apiHooks, "useXApps").mockReturnValue({
    data: {
      active: activeApps,
      unendorsed: unendorsedApps,
      allApps: [...activeApps, ...unendorsedApps],
      endorsed: activeApps,
      newApps: [],
      gracePeriod: [],
      endorsementLost: [],
      newLookingForEndorsement: [],
      othersLookingForEndorsement: [],
    },
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useXAppRoundEarnings").mockReturnValue({
    data: {
      amount: "1",
      appId: "0x123",
    },
    isLoading: false,
    isError: false,
  })
  //@ts-ignore
  vi.spyOn(apiHooks, "useRoundAppVotes").mockReturnValue({
    data: [
      {
        appId: "1",
        voters: 1,
        roundId: Number(roundId),
        totalVotes: 1,
      },
    ],
    isLoading: false,
    isError: false,
  })

  //@ts-ignore
  vi.spyOn(apiHooks, "useXAppMetadata").mockReturnValue({
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
        featured_image: "",
      },
      categories: [],
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
