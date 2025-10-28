export const useUserScore = () => ({
  isUserDelegatee: false,
  isLoading: false,
  scorePercentage: 85,
  isQualified: true,
})

export const useCurrentAllocationsRoundId = () => ({
  data: "1",
  isLoading: false,
})

export const useXApps = () => ({
  data: {
    allApps: [],
    active: [],
    unendorsed: [],
    newLookingForEndorsement: [],
    othersLookingForEndorsement: [],
    endorsed: [],
    newApps: [
      {
        id: "0x123",
        name: "Sample App",
        metadataURI: "",
        createdAtTimestamp: "0",
        isNew: true,
      },
    ],
    gracePeriod: [],
    endorsementLost: [],
  },
  isLoading: false,
})

export const useUserSignalEvents = () => ({
  data: {
    activeSignalEvents: [],
  },
  isLoading: false,
})

export const useBuyVtho = () => ({
  initTransak: () => {
    // Mock Transak initialization
  },
})

export const useUserActionLeaderboard = () => ({
  data: {
    pages: [
      {
        data: [
          { wallet: "0x1234567890123456789012345678901234567890", actionsRewarded: 1000, roundId: 5 },
          { wallet: "0x2345678901234567890123456789012345678901", actionsRewarded: 950, roundId: 5 },
          { wallet: "0x3456789012345678901234567890123456789012", actionsRewarded: 900, roundId: 5 },
          { wallet: "0x4567890123456789012345678901234567890123", actionsRewarded: 850, roundId: 5 },
          { wallet: "0x5678901234567890123456789012345678901234", actionsRewarded: 800, roundId: 5 },
          { wallet: "0x6789012345678901234567890123456789012345", actionsRewarded: 750, roundId: 5 },
          { wallet: "0x7890123456789012345678901234567890123456", actionsRewarded: 700, roundId: 5 },
          { wallet: "0x8901234567890123456789012345678901234567", actionsRewarded: 650, roundId: 5 },
          { wallet: "0x9012345678901234567890123456789012345678", actionsRewarded: 600, roundId: 5 },
          { wallet: "0x0123456789012345678901234567890123456789", actionsRewarded: 550, roundId: 5 },
        ],
        pagination: { hasNext: false },
      },
    ],
  },
  isLoading: false,
  isError: false,
  fetchNextPage: () => {},
  hasNextPage: false,
})

export const useUserActionOverview = () => ({
  data: {
    rankByActionsRewarded: 42,
    actionsRewarded: 350,
  },
  isLoading: false,
  isError: false,
})
