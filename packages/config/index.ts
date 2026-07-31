import localConfig from "./local"
import e2eConfig from "./e2e"
import devConfig from "./dev"
import stagingConfig from "./staging"
import betaConfig from "./beta"
import prodConfig from "./prod"
import { AppEnv, EnvConfig, getContractsConfig } from "./contracts"
import { Network } from "@repo/constants"
import { getPublicEnv, PUBLIC_ENV_KEYS, PublicEnvKey } from "./publicEnv"

export const Environment = {
  LOCAL: "local",
  E2E: "e2e",
  DEV: "dev",
  STAGING: "staging",
  BETA: "beta",
  PROD: "prod",
} as const

export type Environment = (typeof Environment)[keyof typeof Environment]

type B3TRGovernorLibraries = {
  governorClockLogicAddress: string
  governorConfiguratorAddress: string
  governorDepositLogicAddress: string
  governorFunctionRestrictionsLogicAddress: string
  governorProposalLogicAddressAddress: string
  governorQuorumLogicAddress: string
  governorStateLogicAddress: string
  governorVotesLogicAddress: string
}

type PassportLibraries = {
  passportChecksLogicAddress: string
  passportConfiguratorAddress: string
  passportEntityLogicAddress: string
  passportDelegationLogicAddress: string
  passportPersonhoodLogicAddress: string
  passportPoPScoreLogicAddress: string
  passportSignalingLogicAddress: string
  passportWhitelistAndBlacklistLogicAddress: string
}

type XAllocationVotingLibraries = {
  autoVotingLogicAddress: string
}

type ExternalContractIntegrations = {
  // Vet Domains Contract: https://docs.vet.domains/Developers/Contracts/Verification/#verified-contract
  vetDomainsContractAddress: string
}

export type AppConfig = {
  environment: EnvConfig
  basePath?: string
  ipfsPinningService: string
  ipfsFetchingService: string
  b3trContractAddress: string
  vot3ContractAddress: string
  b3trGovernorAddress: string
  timelockContractAddress: string
  xAllocationPoolContractAddress: string
  xAllocationVotingContractAddress: string
  relayerRewardsPoolContractAddress: string
  emissionsContractAddress: string
  voterRewardsContractAddress: string
  galaxyMemberContractAddress: string
  treasuryContractAddress: string
  x2EarnAppsContractAddress: string
  x2EarnCreatorContractAddress: string
  x2EarnRewardsPoolContractAddress: string
  tokenAuctionContractAddress: string
  nodeManagementContractAddress: string
  veBetterPassportContractAddress: string
  challengesContractAddress: string
  b3trGovernorLibraries: B3TRGovernorLibraries
  passportLibraries: PassportLibraries
  xAllocationVotingLibraries: XAllocationVotingLibraries
  b3trMultiSigAddress: string
  stargateNFTContractAddress: string
  stargateContractAddress: string
  grantsManagerContractAddress: string
  dbaPoolContractAddress: string
  navigatorRegistryContractAddress: string
  veDelegateAutoDepositContractAddress: string
  // VeDelegate ERC721 factory (vechain-energy/vedelegate-for-dapps).
  // Empty on non-mainnet envs since veDelegate is only deployed on mainnet.
  veDelegateContractAddress: string
  nodeUrl: string
  indexerUrl?: string
  network: Network

  // External integrations
  externalContractIntegrations?: ExternalContractIntegrations
}

// Chain-shaped values (from NEXT_PUBLIC_APP_ENV or explicit args in hardhat/scripts)
// resolve to the default flavor for that chain so contract-side callers work unchanged.
const chainToFlavor: Record<string, Environment> = {
  [AppEnv.LOCAL]: Environment.LOCAL,
  [AppEnv.E2E]: Environment.E2E,
  [AppEnv.TESTNET]: Environment.DEV,
  [AppEnv.TESTNET_STAGING]: Environment.STAGING,
  [AppEnv.MAINNET]: Environment.PROD,
}

export const getConfig = (env?: Environment | EnvConfig): AppConfig => {
  const raw = env || getPublicEnv("NEXT_PUBLIC_ENVIRONMENT") || getPublicEnv("NEXT_PUBLIC_APP_ENV")
  if (!raw) throw new Error("NEXT_PUBLIC_ENVIRONMENT env variable must be set or a type must be passed to getConfig()")
  const environment = chainToFlavor[raw] ?? raw

  switch (environment) {
    case Environment.LOCAL:
      return localConfig
    case Environment.E2E:
      return e2eConfig
    case Environment.DEV:
      return devConfig
    case Environment.STAGING:
      return stagingConfig
    case Environment.BETA:
      return betaConfig
    case Environment.PROD:
      return prodConfig
    default:
      throw new Error(`Unsupported NEXT_PUBLIC_ENVIRONMENT ${environment}`)
  }
}

export { getContractsConfig, getPublicEnv, PUBLIC_ENV_KEYS }
export type { PublicEnvKey }
