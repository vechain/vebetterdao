const createMockFactory = (_name: string) => ({
  abi: [],
  bytecode: "0x",
  createInterface: () => ({}),
  connect: () => ({}),
})

export const X2EarnApps__factory = createMockFactory("X2EarnApps")
export const XAllocationVoting__factory = createMockFactory("XAllocationVoting")
export const VeBetterPassport__factory = createMockFactory("VeBetterPassport")
export const B3TRGovernor__factory = createMockFactory("B3TRGovernor")
export const VOT3__factory = createMockFactory("VOT3")
export const B3TR__factory = createMockFactory("B3TR")
export const VoterRewards__factory = createMockFactory("VoterRewards")
export const GalaxyMember__factory = createMockFactory("GalaxyMember")
export const XAllocationPool__factory = createMockFactory("XAllocationPool")
export const NodeManagement__factory = createMockFactory("NodeManagement")
export const GrantsManager__factory = createMockFactory("GrantsManager")
export const Emissions__factory = createMockFactory("Emissions")
export const X2EarnCreator__factory = createMockFactory("X2EarnCreator")
export const AccessControl__factory = createMockFactory("AccessControl")
export const Treasury__factory = createMockFactory("Treasury")

export * from "./empty"
