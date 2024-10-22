import localConfig from "./local"
import stagingConfig from "./testnet-staging"
import testnetConfig from "./testnet"
import mainnetConfig from "./mainnet"
import { EnvConfig, getContractsConfig } from "./contracts"
import { Network } from "@repo/constants"
import { getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv } from "./datadog"

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

export type AppConfig = {
  environment: EnvConfig
  basePath?: string
  ipfsPinningService: string
  ipfsFetchingService: string
  mixPanelProjectToken?: string
  b3trContractAddress: string
  vot3ContractAddress: string
  b3trGovernorAddress: string
  veBetterPassportAddress: string
  timelockContractAddress: string
  xAllocationPoolContractAddress: string
  xAllocationVotingContractAddress: string
  emissionsContractAddress: string
  voterRewardsContractAddress: string
  galaxyMemberContractAddress: string
  treasuryContractAddress: string
  x2EarnAppsContractAddress: string
  x2EarnRewardsPoolContractAddress: string
  nodeManagementContractAddress: string
  veBetterPassportContractAddress: string
  b3trGovernorLibraries: B3TRGovernorLibraries
  passportLibraries: PassportLibraries
  nodeUrl: string
  indexerUrl?: string
  network: Network
}

export const getConfig = (env?: EnvConfig): AppConfig => {
  const appEnv = env || process.env.NEXT_PUBLIC_APP_ENV
  if (!appEnv) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set or a type must be passed to getConfig()")
  if (appEnv === "local") return localConfig
  if (appEnv === "e2e") return localConfig
  if (appEnv === "testnet-staging") return stagingConfig
  if (appEnv === "testnet") return testnetConfig
  if (appEnv === "mainnet") return mainnetConfig
  throw new Error(`Unsupported NEXT_PUBLIC_APP_ENV ${appEnv}`)
}

export { getContractsConfig, getEnvDatadogApp, getEnvDatadogClient, getEnvDatadogEnv }
