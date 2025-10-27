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
  initTransak: () => console.log("Mock Transak initialized"),
})
