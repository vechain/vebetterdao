import { flag } from "flags/next"

export const galaxyMemberUpgrades = flag<boolean>({
  key: "galaxyMemberUpgrades",
  decide() {
    return true
  },
})

export const vechainKit = flag<boolean>({
  key: "vechainKit",
  decide() {
    return false
  },
})

export const allocationRedesign = flag<boolean>({
  key: "allocation-redesign",
  decide() {
    return false
  },
})
