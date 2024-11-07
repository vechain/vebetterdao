export enum FeatureFlag {
  GALAXY_MEMBER_UPGRADES = "galaxyMemberUpgrades",
}

type FeatureFlagConfig = {
  [key in FeatureFlag]: {
    enabled: boolean
    comingSoonText?: string
  }
}

export const featureFlags: FeatureFlagConfig = {
  [FeatureFlag.GALAXY_MEMBER_UPGRADES]: {
    enabled: false,
    comingSoonText: "GM upgrades coming soon!",
  },
}
