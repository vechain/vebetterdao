import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { X2EarnApps, NodeManagementV3 } from "../../typechain-types"
import * as fs from "fs"
import * as path from "path"

interface EndorserNode {
  nodeId: string
  owner: string
  nodePoints: string
  isLegacy: boolean
  nodeType: "Legacy" | "Stargate"
}

interface AppWithEndorsers {
  appId: string
  appName: string
  appPoints: string
  endorsers: EndorserNode[]
  totalLegacyPoints: string
  remainingPointsAfterLegacy: string
  belowThreshold: boolean // true if remaining points after legacy < 100
}

/**
 * Fetches AppEndorsed events in chunks to avoid RPC limits
 */
async function fetchAppEndorsementEvents(x2EarnApps: X2EarnApps, startBlock: number = 0) {
  console.log("🔍 Fetching endorsement events...")

  const filter = x2EarnApps.filters.AppEndorsed()
  const currentBlock = await ethers.provider.getBlockNumber()
  const chunkSize = 10000
  const allEvents: Awaited<ReturnType<typeof x2EarnApps.queryFilter>> = []

  let chunksProcessed = 0
  const totalChunks = Math.ceil((currentBlock - startBlock + 1) / chunkSize)

  for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock)
    chunksProcessed++

    if (chunksProcessed % 5 === 0 || chunksProcessed === totalChunks) {
      console.log(`   Processing chunk ${chunksProcessed}/${totalChunks}...`)
    }

    const events = await x2EarnApps.queryFilter(filter, fromBlock, toBlock)
    allEvents.push(...events)
  }

  console.log(`✅ Found ${allEvents.length} endorsement events\n`)

  return allEvents
}

/**
 * Fetches all apps with endorsers (both Stargate and Legacy nodes)
 * For each endorser, shows: node ID, type (⭐ Stargate or ⏳ Legacy), endorsement points, and owner address
 * Calculates if app points minus legacy endorser points drops below 100
 *
 * Environment Variables:
 * - NEXT_PUBLIC_APP_ENV: Network environment (required)
 * - SHOW_ALL_APPS: Filter mode (optional, defaults to true)
 *   - Set to "false" to show only apps below threshold
 *   - Any other value or unset shows all apps
 *
 * Usage Examples:
 * - Show all apps:
 *   NEXT_PUBLIC_APP_ENV=mainnet npx hardhat run scripts/data/getAppEndorsersNodesInfo.ts
 * - Show only apps below threshold:
 *   SHOW_ALL_APPS=false NEXT_PUBLIC_APP_ENV=mainnet npx hardhat run scripts/data/getAppEndorsersNodesInfo.ts
 *
 * Outputs:
 * - JSON file with complete data
 * - TXT file with formatted report including all endorsers with emojis
 * Flags apps where (app points - sum of legacy endorser points) < 100 with ⚠️
 */
async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV environment variable")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  // Flag to control output: true = all apps, false = only below threshold
  const showAllApps = false // Defaults to true

  console.log("\n" + "=".repeat(80))
  console.log("🔍 FETCHING ALL APPS WITH ENDORSERS (STARGATE & LEGACY)")
  console.log("=".repeat(80))
  console.log(`Network: ${config.network.name}`)
  console.log(`X2EarnApps: ${config.x2EarnAppsContractAddress}`)
  console.log(`NodeManagement: ${config.nodeManagementContractAddress}`)
  console.log(`Filter Mode: ${showAllApps ? "ALL APPS" : "ONLY BELOW THRESHOLD"}`)
  console.log("=".repeat(80) + "\n")

  // Connect to contracts
  const x2EarnApps = (await ethers.getContractAt(
    "X2EarnApps",
    config.x2EarnAppsContractAddress,
  )) as unknown as X2EarnApps
  const nodeManagement = (await ethers.getContractAt(
    "NodeManagementV3",
    config.nodeManagementContractAddress,
  )) as unknown as NodeManagementV3

  // Get all apps (both endorsed and unendorsed)
  console.log("📱 Fetching all apps...")
  const [endorsedApps, unendorsedApps] = await Promise.all([x2EarnApps.apps(), x2EarnApps.unendorsedApps()])

  const allApps = [...endorsedApps, ...unendorsedApps]
  console.log(
    `   Found ${allApps.length} total apps (${endorsedApps.length} endorsed, ${unendorsedApps.length} unendorsed)\n`,
  )

  // Fetch all endorsement events
  const endorsementEvents = await fetchAppEndorsementEvents(x2EarnApps)

  // Build a map of appId -> Set of currently endorsed nodeIds
  const appEndorsersMap = new Map<string, Set<bigint>>()

  for (const event of endorsementEvents) {
    if (!event.args) continue

    const appId = event.args[0] as string
    const nodeId = event.args[1] as bigint
    const endorsed = event.args[2] as boolean

    if (!appEndorsersMap.has(appId)) {
      appEndorsersMap.set(appId, new Set())
    }

    const nodeSet = appEndorsersMap.get(appId)!

    if (endorsed) {
      nodeSet.add(nodeId)
    } else {
      nodeSet.delete(nodeId)
    }
  }

  // Process each app - include all apps with endorsers
  console.log("⚙️  Processing apps and their endorsers...\n")
  const appsWithEndorsers: AppWithEndorsers[] = []
  let processedCount = 0

  for (const app of allApps) {
    const appId = app.id
    const appName = app.name

    const nodeIds = appEndorsersMap.get(appId) || new Set<bigint>()

    if (nodeIds.size === 0) {
      continue
    }

    processedCount++
    if (processedCount % 10 === 0) {
      console.log(`   Processed ${processedCount} apps...`)
    }

    const endorsers: EndorserNode[] = []

    // For each node ID, get its info and whether it's legacy or stargate
    for (const nodeId of nodeIds) {
      try {
        const isLegacy = await nodeManagement.isLegacyNode(nodeId)
        const owner = await nodeManagement.getNodeManager(nodeId)
        const nodePoints = await x2EarnApps.getNodeEndorsementScore(nodeId)

        endorsers.push({
          nodeId: nodeId.toString(),
          owner,
          nodePoints: nodePoints.toString(),
          isLegacy,
          nodeType: isLegacy ? "Legacy" : "Stargate",
        })
      } catch (error) {
        console.log(`   ⚠️  Error processing node ${nodeId} for ${appName}`)
      }
    }

    if (endorsers.length === 0) {
      continue
    }

    // Get app points
    const appPoints = await x2EarnApps.getScore(appId)

    // Calculate total legacy points and remaining points after legacy
    const totalLegacyPoints = endorsers
      .filter(e => e.isLegacy)
      .reduce((sum, endorser) => sum + BigInt(endorser.nodePoints), 0n)
    const remainingPointsAfterLegacy = appPoints - totalLegacyPoints
    const belowThreshold = remainingPointsAfterLegacy < 100n

    appsWithEndorsers.push({
      appId,
      appName,
      appPoints: appPoints.toString(),
      endorsers,
      totalLegacyPoints: totalLegacyPoints.toString(),
      remainingPointsAfterLegacy: remainingPointsAfterLegacy.toString(),
      belowThreshold,
    })
  }

  console.log(`✅ Finished processing ${processedCount} apps with endorsers\n`)

  // Calculate summary statistics
  const appsBelowThreshold = appsWithEndorsers.filter(app => app.belowThreshold)
  const appsWithLegacy = appsWithEndorsers.filter(app => app.endorsers.some(e => e.isLegacy))
  const appsToDisplay = showAllApps ? appsWithEndorsers : appsBelowThreshold

  // Print summary
  console.log("=".repeat(80))
  console.log("📊 SUMMARY")
  console.log("=".repeat(80))
  console.log(`Total apps in system:           ${allApps.length}`)
  console.log(`Apps with endorsers:            ${appsWithEndorsers.length}`)
  console.log(`Apps with legacy endorsers:     ${appsWithLegacy.length}`)
  console.log(`Apps below threshold (⚠️):       ${appsBelowThreshold.length}`)
  console.log(`Apps in report:                 ${appsToDisplay.length} (${showAllApps ? "all" : "threshold only"})`)
  console.log("=".repeat(80) + "\n")

  // Prepare output directory
  const outputDir = path.join(__dirname, "../../output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = Date.now()
  const filterSuffix = showAllApps ? "all" : "threshold-only"
  const baseFilename = `apps-endorsers-${config.network.name}-${filterSuffix}-${timestamp}`

  // Save to JSON file
  const outputData = {
    network: config.network.name,
    timestamp: new Date().toISOString(),
    filterMode: showAllApps ? "all_apps" : "below_threshold_only",
    contracts: {
      x2EarnApps: config.x2EarnAppsContractAddress,
      nodeManagement: config.nodeManagementContractAddress,
    },
    summary: {
      totalApps: allApps.length,
      appsWithEndorsers: appsWithEndorsers.length,
      appsWithLegacyEndorsers: appsWithLegacy.length,
      appsBelowThreshold: appsBelowThreshold.length,
      appsDisplayed: appsToDisplay.length,
    },
    apps: appsToDisplay,
  }

  const jsonPath = path.join(outputDir, `${baseFilename}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2))
  console.log(`💾 JSON data saved to: ${jsonPath}`)

  // Create TXT file with formatted output
  let txtContent = ""
  txtContent += "================================================================================\n"
  txtContent += "                   APP ENDORSERS REPORT\n"
  txtContent += "================================================================================\n"
  txtContent += `Network:     ${config.network.name}\n`
  txtContent += `Generated:   ${new Date().toISOString()}\n`
  txtContent += `Filter:      ${showAllApps ? "ALL APPS" : "BELOW THRESHOLD ONLY"}\n`
  txtContent += "================================================================================\n\n"

  txtContent += "SUMMARY\n"
  txtContent += "─".repeat(80) + "\n"
  txtContent += `Total apps in system:           ${allApps.length}\n`
  txtContent += `Apps with endorsers:            ${appsWithEndorsers.length}\n`
  txtContent += `Apps with legacy endorsers:     ${appsWithLegacy.length}\n`
  txtContent += `Apps below threshold:           ${appsBelowThreshold.length}\n`
  txtContent += `Apps in this report:            ${appsToDisplay.length}\n\n`

  txtContent += "LEGEND\n"
  txtContent += "─".repeat(80) + "\n"
  txtContent += "⭐ Stargate Node  |  ⏳ Legacy Node  |  ⚠️  Below threshold (<100 after legacy)\n\n"
  txtContent += "================================================================================\n"
  txtContent += `${showAllApps ? "ALL APPS" : "APPS BELOW THRESHOLD"}\n`
  txtContent += "================================================================================\n\n"

  for (const appInfo of appsToDisplay) {
    const warningPrefix = appInfo.belowThreshold ? "⚠️  " : ""
    const legacyCount = appInfo.endorsers.filter(e => e.isLegacy).length
    const stargateCount = appInfo.endorsers.filter(e => !e.isLegacy).length

    txtContent += `${warningPrefix}${appInfo.appName}\n`
    txtContent += `App Points: ${appInfo.appPoints}  |  `
    txtContent += `Legacy Points: ${appInfo.totalLegacyPoints}  |  `
    txtContent += `Remaining: ${appInfo.remainingPointsAfterLegacy}  |  `
    txtContent += `Endorsers: ⭐${stargateCount} ⏳${legacyCount}\n`

    if (appInfo.belowThreshold) {
      txtContent += `⚠️  WARNING: Below 100 points after removing legacy\n`
    }

    txtContent += `\n`

    for (const endorser of appInfo.endorsers) {
      const emoji = endorser.isLegacy ? "⏳" : "⭐"
      txtContent += `  ${emoji} Node ${endorser.nodeId} | ${endorser.nodePoints} pts | ${endorser.owner}\n`
    }

    txtContent += "\n"
  }

  const txtPath = path.join(outputDir, `${baseFilename}.txt`)
  fs.writeFileSync(txtPath, txtContent)
  console.log(`📄 TXT report saved to: ${txtPath}`)

  if (showAllApps) {
    console.log("\n💡 Tip: Set SHOW_ALL_APPS=false to show only apps below threshold")
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
