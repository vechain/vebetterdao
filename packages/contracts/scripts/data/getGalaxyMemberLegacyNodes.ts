import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { GalaxyMember, NodeManagementV3 } from "../../typechain-types"
import * as fs from "fs"
import * as path from "path"

interface AttachedNodeInfo {
  nodeId: string
  gmTokenId: string
  isLegacy: boolean
  nodeType: "Legacy" | "Stargate"
  owner: string
}

/**
 * Fetches NodeAttached and NodeDetached events in chunks to avoid RPC limits
 */
async function fetchNodeEvents(galaxyMember: GalaxyMember, startBlock: number = 0) {
  console.log("\n🔍 Fetching node attachment events...")

  const attachFilter = galaxyMember.filters.NodeAttached()
  const detachFilter = galaxyMember.filters.NodeDetached()
  const currentBlock = await ethers.provider.getBlockNumber()
  const chunkSize = 10000

  const allAttachEvents: Awaited<ReturnType<typeof galaxyMember.queryFilter>> = []
  const allDetachEvents: Awaited<ReturnType<typeof galaxyMember.queryFilter>> = []

  for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock)
    console.log(`   Fetching events from block ${fromBlock} to ${toBlock}...`)

    const [attachEvents, detachEvents] = await Promise.all([
      galaxyMember.queryFilter(attachFilter, fromBlock, toBlock),
      galaxyMember.queryFilter(detachFilter, fromBlock, toBlock),
    ])

    allAttachEvents.push(...attachEvents)
    allDetachEvents.push(...detachEvents)

    console.log(`   Found ${attachEvents.length} attach and ${detachEvents.length} detach events`)
  }

  console.log(`   Total attach events: ${allAttachEvents.length}`)
  console.log(`   Total detach events: ${allDetachEvents.length}\n`)

  return { attachEvents: allAttachEvents, detachEvents: allDetachEvents }
}

/**
 * Main function to fetch all attached nodes to Galaxy Member and identify legacy nodes
 */
async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV environment variable")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log("\n" + "=".repeat(80))
  console.log("🌌 FETCHING GALAXY MEMBER ATTACHED LEGACY NODES")
  console.log("=".repeat(80))
  console.log(`Network: ${config.network.name}`)
  console.log(`GalaxyMember: ${config.galaxyMemberContractAddress}`)
  console.log(`NodeManagement: ${config.nodeManagementContractAddress}`)
  console.log("=".repeat(80) + "\n")

  // Connect to contracts
  const galaxyMember = (await ethers.getContractAt(
    "GalaxyMember",
    config.galaxyMemberContractAddress,
  )) as unknown as GalaxyMember
  const nodeManagement = (await ethers.getContractAt(
    "NodeManagementV3",
    config.nodeManagementContractAddress,
  )) as unknown as NodeManagementV3

  // Fetch all node attachment/detachment events
  const { attachEvents, detachEvents } = await fetchNodeEvents(galaxyMember)

  // Build a map of currently attached nodes (nodeId -> gmTokenId)
  const attachedNodesMap = new Map<bigint, bigint>()

  // Process attach events
  for (const event of attachEvents) {
    if (!event.args) continue
    const nodeId = event.args[0] as bigint // nodeTokenId
    const gmTokenId = event.args[1] as bigint // tokenId
    attachedNodesMap.set(nodeId, gmTokenId)
  }

  // Process detach events (remove from map)
  for (const event of detachEvents) {
    if (!event.args) continue
    const nodeId = event.args[0] as bigint // nodeTokenId
    attachedNodesMap.delete(nodeId)
  }

  console.log(`📊 Currently attached nodes: ${attachedNodesMap.size}\n`)

  // Check each attached node to see if it's legacy
  const attachedNodes: AttachedNodeInfo[] = []
  let legacyCount = 0
  let stargateCount = 0

  for (const [nodeId, gmTokenId] of attachedNodesMap) {
    try {
      const isLegacy = await nodeManagement.isLegacyNode(nodeId)
      const owner = await nodeManagement.getNodeManager(nodeId)

      const nodeInfo: AttachedNodeInfo = {
        nodeId: nodeId.toString(),
        gmTokenId: gmTokenId.toString(),
        isLegacy,
        nodeType: isLegacy ? "Legacy" : "Stargate",
        owner,
      }

      attachedNodes.push(nodeInfo)

      if (isLegacy) {
        legacyCount++
      } else {
        stargateCount++
      }

      console.log(`🔹 Node ID: ${nodeId} -> GM Token ID: ${gmTokenId}`)
      console.log(`   Type: ${isLegacy ? "Legacy ⏳" : "Stargate ⭐"}`)
      console.log(`   Owner: ${owner}`)
    } catch (error) {
      console.log(`   ⚠️  Error checking node ${nodeId}:`, (error as Error).message)
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(80))
  console.log("📊 SUMMARY")
  console.log("=".repeat(80))
  console.log(`✅ Total attached nodes: ${attachedNodesMap.size}`)
  console.log(`⏳ Legacy nodes: ${legacyCount}`)
  console.log(`⭐ Stargate nodes: ${stargateCount}`)
  console.log("=".repeat(80) + "\n")

  // Save to JSON file
  const outputData = {
    network: config.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      galaxyMember: config.galaxyMemberContractAddress,
      nodeManagement: config.nodeManagementContractAddress,
    },
    summary: {
      totalAttachedNodes: attachedNodesMap.size,
      legacyNodes: legacyCount,
      stargateNodes: stargateCount,
    },
    attachedNodes: attachedNodes,
    legacyNodesOnly: attachedNodes.filter(node => node.isLegacy),
  }

  const outputDir = path.join(__dirname, "../../output")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const filename = `gm-legacy-nodes-${config.network.name}-${Date.now()}.json`
  const outputPath = path.join(outputDir, filename)

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))

  console.log(`💾 Data saved to: ${outputPath}\n`)
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
