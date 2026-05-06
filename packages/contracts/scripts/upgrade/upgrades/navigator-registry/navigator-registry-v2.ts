import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"

import { upgradeProxy } from "../../../helpers"
import { navigatorRegistryLibraries } from "../../../libraries/navigatorRegistryLibraries"
import { NavigatorRegistry } from "../../../../typechain-types"

type IndexerNavigator = { address: string; status: string }
type IndexerCitizen = { citizen: string }
type Pagination = { hasNext: boolean }

const INDEXER_HEADERS = { "x-project-id": "b3tr-governor" }

async function fetchAllNavigators(indexerBase: string): Promise<string[]> {
  const url = `${indexerBase}/api/v1/b3tr/navigators?size=500`
  const res = await fetch(url, { headers: INDEXER_HEADERS })
  if (!res.ok) throw new Error(`Indexer GET ${url} → ${res.status}`)
  const body = (await res.json()) as { data: IndexerNavigator[] }
  return body.data.filter(n => n.status === "ACTIVE" || n.status === "EXITING").map(n => n.address)
}

async function fetchCitizensFor(indexerBase: string, navigator: string): Promise<string[]> {
  const out: string[] = []
  let page = 0
  // Cap pages defensively in case of indexer bugs
  while (page < 1000) {
    const url = `${indexerBase}/api/v1/b3tr/navigators/citizens?navigator=${navigator}&page=${page}&size=100&direction=DESC`
    const res = await fetch(url, { headers: INDEXER_HEADERS })
    if (!res.ok) throw new Error(`Indexer GET ${url} → ${res.status}`)
    const body = (await res.json()) as { data: IndexerCitizen[]; pagination: Pagination }
    out.push(...body.data.map(c => c.citizen.toLowerCase()))
    if (!body.pagination.hasNext) break
    page++
  }
  return out
}

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }
  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  if (!config.indexerUrl) {
    throw new Error("Missing indexerUrl in config — needed to enumerate delegated citizens")
  }
  const indexerBase = config.indexerUrl.replace(/\/api\/v1\/?$/, "")

  console.log(`Upgrading NavigatorRegistry at ${config.navigatorRegistryContractAddress}`)
  console.log(`Indexer: ${indexerBase}`)

  // 1. Enumerate currently-delegating citizens via indexer (union over all alive navigators)
  const navigators = await fetchAllNavigators(indexerBase)
  console.log(`Found ${navigators.length} alive navigators`)
  const citizenSet = new Set<string>()
  for (const nav of navigators) {
    const citizens = await fetchCitizensFor(indexerBase, nav)
    for (const c of citizens) citizenSet.add(c)
  }
  const candidates = [...citizenSet]
  console.log(`Found ${candidates.length} unique delegating citizens`)

  // 2. Authoritative on-chain compare — indexer is just for enumeration
  const navigator = await ethers.getContractAt("NavigatorRegistry", config.navigatorRegistryContractAddress)
  const vot3 = await ethers.getContractAt("VOT3", config.vot3ContractAddress)

  const block = await ethers.provider.getBlockNumber()
  const affected: string[] = []
  for (const citizen of candidates) {
    const [delegated, balance] = await Promise.all([navigator.getDelegatedAmount(citizen), vot3.balanceOf(citizen)])
    if (delegated > balance) {
      console.log(`  over-delegated: ${citizen} delegated=${delegated.toString()} balance=${balance.toString()}`)
      affected.push(citizen)
    }
  }
  console.log(`Block ${block}: ${affected.length} over-delegated citizens to correct`)

  // 3. Fresh libraries (always redeployed per CLAUDE.md upgrade rules)
  const libs = await navigatorRegistryLibraries(true)
  const libraryAddresses: Record<string, string> = {
    NavigatorStakingUtils: await libs.NavigatorStakingUtils.getAddress(),
    NavigatorDelegationUtils: await libs.NavigatorDelegationUtils.getAddress(),
    NavigatorVotingUtils: await libs.NavigatorVotingUtils.getAddress(),
    NavigatorFeeUtils: await libs.NavigatorFeeUtils.getAddress(),
    NavigatorSlashingUtils: await libs.NavigatorSlashingUtils.getAddress(),
    NavigatorLifecycleUtils: await libs.NavigatorLifecycleUtils.getAddress(),
  }

  // 4. Upgrade — initializeV2(affected) runs in the same tx
  const upgraded = (await upgradeProxy(
    "NavigatorRegistry",
    "NavigatorRegistry",
    config.navigatorRegistryContractAddress,
    [affected],
    {
      version: 2,
      libraries: libraryAddresses,
    },
  )) as unknown as NavigatorRegistry

  const newVersion = await upgraded.version()
  console.log(`New NavigatorRegistry version: ${newVersion}`)
  if (newVersion !== "2") {
    throw new Error(`NavigatorRegistry version is not 2: ${newVersion}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

main()
