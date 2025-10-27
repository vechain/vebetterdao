// @ts-ignore
import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"

//typed contract names
type ContractName =
  | "VOT3"
  | "B3TRGovernor"
  | "GalaxyMember"
  | "X2EarnApps"
  | "VeBetterPassport"
  | "Emissions"
  | "TimeLock"
  | "XAllocationPool"
  | "XAllocationVoting"
  | "VoterRewards"
  | "Treasury"
  | "X2EarnRewardsPool"
  | "X2EarnCreator"
  | "GrantsManager"
  | "DBAPool"
  | "RelayerRewardsPool"

const PROXY_ABI = ["event Upgraded(address indexed implementation)"]

interface ContractInfo {
  Contract: ContractName
  Proxy: string
  Implementation: string
  Libraries: string
  Status: string
}

async function getImplementationAddress(proxyAddress: string): Promise<string | null> {
  try {
    const proxyContract = await ethers.getContractAt(PROXY_ABI, proxyAddress)
    const events = await proxyContract.queryFilter(proxyContract.filters.Upgraded(), 0, "latest")
    if (events.length === 0) return null
    const latestEvent = events[events.length - 1]
    return latestEvent.args?.implementation || latestEvent.args?.[0] || null
  } catch (error) {
    return null
  }
}

async function getVerificationMatch(address: string, chainId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://sourcify.dev/server/v2/contract/${chainId}/${address}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.runtimeMatch || null
  } catch {
    return null
  }
}

function getLibraryAddresses(contractName: ContractName, config: any): string[] {
  if (contractName === "B3TRGovernor") {
    return [
      config.b3trGovernorLibraries.governorClockLogicAddress,
      config.b3trGovernorLibraries.governorConfiguratorAddress,
      config.b3trGovernorLibraries.governorDepositLogicAddress,
      config.b3trGovernorLibraries.governorFunctionRestrictionsLogicAddress,
      config.b3trGovernorLibraries.governorProposalLogicAddressAddress,
      config.b3trGovernorLibraries.governorQuorumLogicAddress,
      config.b3trGovernorLibraries.governorStateLogicAddress,
      config.b3trGovernorLibraries.governorVotesLogicAddress,
    ]
  }
  if (contractName === "VeBetterPassport") {
    return [
      config.passportLibraries.passportChecksLogicAddress,
      config.passportLibraries.passportConfiguratorAddress,
      config.passportLibraries.passportEntityLogicAddress,
      config.passportLibraries.passportDelegationLogicAddress,
      config.passportLibraries.passportPersonhoodLogicAddress,
      config.passportLibraries.passportPoPScoreLogicAddress,
      config.passportLibraries.passportSignalingLogicAddress,
      config.passportLibraries.passportWhitelistAndBlacklistLogicAddress,
    ]
  }
  return []
}

async function getVerificationStatus(
  proxyAddress: string,
  implementationAddress: string | null,
  libraryAddresses: string[],
  chainId: bigint,
): Promise<string> {
  const chainIdStr = chainId.toString()
  const checks: Array<{ type: string; match: string | null }> = []

  const proxyMatch = await getVerificationMatch(proxyAddress, chainIdStr)
  checks.push({ type: "Proxy", match: proxyMatch })

  if (implementationAddress) {
    const implMatch = await getVerificationMatch(implementationAddress, chainIdStr)
    checks.push({ type: "Implementation", match: implMatch })
  }

  for (const libAddress of libraryAddresses) {
    const libMatch = await getVerificationMatch(libAddress, chainIdStr)
    checks.push({ type: "Library", match: libMatch })
  }

  const exactMatches = checks.filter(c => c.match === "exact_match").length
  const total = checks.length

  if (exactMatches === total) return "Fully Verified"
  if (exactMatches > 0) return "Partially Verified"
  return "Not Verified"
}

function hasLibraries(contractName: ContractName): string {
  const libraryContracts = ["B3TRGovernor", "VeBetterPassport"]
  return libraryContracts.includes(contractName) ? "Yes" : "No"
}

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV environment variable")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const network = await ethers.provider.getNetwork()

  console.log(`\n${config.network.name} (Chain ID: ${network.chainId})\n`)

  const contracts: Array<{ proxy: string; name: ContractName }> = [
    { proxy: config.vot3ContractAddress, name: "VOT3" },
    { proxy: config.b3trGovernorAddress, name: "B3TRGovernor" },
    { proxy: config.galaxyMemberContractAddress, name: "GalaxyMember" },
    { proxy: config.x2EarnAppsContractAddress, name: "X2EarnApps" },
    { proxy: config.veBetterPassportContractAddress, name: "VeBetterPassport" },
    { proxy: config.emissionsContractAddress, name: "Emissions" },
    { proxy: config.timelockContractAddress, name: "TimeLock" },
    { proxy: config.xAllocationPoolContractAddress, name: "XAllocationPool" },
    { proxy: config.xAllocationVotingContractAddress, name: "XAllocationVoting" },
    { proxy: config.voterRewardsContractAddress, name: "VoterRewards" },
    { proxy: config.treasuryContractAddress, name: "Treasury" },
    { proxy: config.x2EarnRewardsPoolContractAddress, name: "X2EarnRewardsPool" },
    { proxy: config.x2EarnCreatorContractAddress, name: "X2EarnCreator" },
    { proxy: config.grantsManagerContractAddress, name: "GrantsManager" },
    { proxy: config.dbaPoolContractAddress, name: "DBAPool" },
    { proxy: config.relayerRewardsPoolContractAddress, name: "RelayerRewardsPool" },
  ]

  const contractsInfo: ContractInfo[] = []

  for (const contract of contracts) {
    const implementation = await getImplementationAddress(contract.proxy)
    const libraryAddresses = getLibraryAddresses(contract.name, config)
    const status = await getVerificationStatus(contract.proxy, implementation, libraryAddresses, network.chainId)

    contractsInfo.push({
      Contract: contract.name,
      Proxy: contract.proxy,
      Implementation: implementation || "Not found",
      Libraries: hasLibraries(contract.name),
      Status: status,
    })
  }

  console.table(contractsInfo)

  const failed = contractsInfo.filter(c => c.Implementation === "Not found").length
  console.log(`\n${contractsInfo.length - failed}/${contractsInfo.length} implementations found\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error("Error:", error.message)
  process.exit(1)
})
