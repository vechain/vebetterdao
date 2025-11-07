export enum FeatureFlag {
  GALAXY_MEMBER_UPGRADES = "galaxyMemberUpgrades",
  VECHAIN_KIT = "vechainKit",
  ALLOCATION_REDESIGN = "allocation-redesign",
}
type FeatureFlagConfig = Record<
  FeatureFlag,
  {
    enabled: boolean
    comingSoonText?: string
  }
>
export const featureFlags: FeatureFlagConfig = {
  [FeatureFlag.GALAXY_MEMBER_UPGRADES]: {
    enabled: true,
    comingSoonText: "GM upgrades coming soon!",
  },
  [FeatureFlag.VECHAIN_KIT]: { enabled: false },
  [FeatureFlag.ALLOCATION_REDESIGN]: { enabled: true },
}
