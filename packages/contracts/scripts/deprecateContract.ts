import fs from "fs"
import path from "path"

/**
 * Gets the highest version number from the deprecated directory
 * @param deprecatedDir Path to the deprecated directory
 * @returns The highest version number found
 */
function getHighestVersionNumber(deprecatedDir: string): number {
  if (!fs.existsSync(deprecatedDir)) {
    console.log("Deprecated directory not found:", deprecatedDir)
    return 0
  }

  const versionDirs = fs
    .readdirSync(deprecatedDir)
    .filter(dir => dir.startsWith("V") && /^V\d+$/.test(dir))
    .map(dir => parseInt(dir.substring(1)))
    .sort((a, b) => b - a) // Sort in descending order

  return versionDirs[0] || 0 // Return highest version or 0 if none found
}

/**
 * Finds related contracts by analyzing imports
 * @param contractPath Path to the main contract
 * @returns Array of related contract paths
 */
function findRelatedContracts(contractPath: string): string[] {
  const content = fs.readFileSync(contractPath, "utf8")
  const importLines = content.match(/import\s+{[^}]+}\s+from\s+["'][^"']+["']/g) || []
  const contractDir = path.dirname(contractPath)

  const relatedPaths = importLines
    .map(line => {
      const match = line.match(/from\s+["']([^"']+)["']/)
      if (!match) return null

      const importPath = match[1]
      // Skip OpenZeppelin and other external contracts
      if (importPath.includes("@openzeppelin/") || importPath.startsWith("@")) {
        return null
      }

      // Resolve the import path relative to the contract
      const absolutePath = path.resolve(contractDir, importPath)

      // Only include .sol files that are within our project's contracts directory
      if (
        absolutePath.endsWith(".sol") &&
        absolutePath.includes("/contracts/") &&
        !absolutePath.includes("/node_modules/")
      ) {
        return absolutePath
      }
      return null
    })
    .filter(Boolean) as string[]

  return [...new Set(relatedPaths)] // Remove duplicates
}

/**
 * Finds the highest version for a contract in deprecated directory
 * @param contractName Base name of the contract
 * @param deprecatedDir Path to the deprecated directory
 * @returns The version number where contract was found, or 0 if not found
 */
function findContractHighestVersion(contractName: string, deprecatedDir: string): number {
  const highestVersion = getHighestVersionNumber(deprecatedDir)
  if (highestVersion === 0) return 0

  // Check if contract exists in highest version folder
  const versionedContractName = `${contractName}V${highestVersion}.sol`
  const contractPath = path.join(deprecatedDir, `V${highestVersion}`, versionedContractName)

  if (fs.existsSync(contractPath)) {
    return highestVersion
  }

  return 0
}

/**
 * Updates import paths in deprecated contract
 * @param content Contract content
 * @param version Version number
 * @returns Updated content with versioned import paths
 */
function updateImportPaths(content: string): string {
  // For each interface import, find its highest version in the deprecated directory
  return content.replace(/from ["'](\.\/interfaces\/[^"']+)\.sol["']/g, (_, path) => {
    const interfaceName = path.split("/").pop()
    // Don't increment interface version, use the current version
    return `from "../../interfaces/${interfaceName}.sol"`
  })
}

/**
 * Updates version history in comments and version() function
 * @param content Contract content
 * @param newVersion New version number
 * @param description Description of the new version
 */
function updateVersionHistory(content: string, newVersion: number, description: string): string {
  // Find the last comment end marker using string search instead of regex
  const commentEnd = "*/"
  const lastCommentEndIndex = content.lastIndexOf(commentEnd)
  if (lastCommentEndIndex === -1) {
    return content
  }

  // Insert new version entry
  const versionEntry = ` * ----- Version ${newVersion} -----\n * - ${description}\n */`
  let updatedContent =
    content.slice(0, lastCommentEndIndex) + "\n" + versionEntry + content.slice(lastCommentEndIndex + commentEnd.length)

  // Update version in the SC function version()
  const versionFuncPattern =
    /function\s+version\s*\(\s*\)\s*(?:external|public|view)?\s*returns\s*\(string\s+memory\)\s*{[^}]*return\s+["']\d+["']\s*;/

  const replacement = `function version() external pure virtual returns (string memory) {\n    return "${newVersion}";`

  // Only attempt replacement if pattern is found
  if (versionFuncPattern.test(updatedContent)) {
    updatedContent = updatedContent.replace(versionFuncPattern, replacement)
  }

  return updatedContent
}

/**
 * Deprecates a single contract
 * @param contractPath Path to the contract
 * @param description Version description
 * @param deprecatedDir Directory where deprecated contracts are stored
 * @returns The new version number
 */
function deprecateContract(contractPath: string, description: string, deprecatedDir: string): number {
  // Get contract name without version suffix
  const contractName = path.basename(contractPath, ".sol").replace(/V\d+$/, "")

  // Find current version
  const currentVersion = findContractHighestVersion(contractName, deprecatedDir)
  const nextVersion = currentVersion > 0 ? currentVersion + 1 : 1

  // Read original content
  const originalContent = fs.readFileSync(contractPath, "utf8")

  // Create deprecated version directory
  const targetDir = path.join(deprecatedDir, `V${nextVersion}`)
  fs.mkdirSync(targetDir, { recursive: true })

  // Create deprecated contract
  const deprecatedContractName = `${contractName}V${nextVersion}.sol`
  const deprecatedPath = path.join(targetDir, deprecatedContractName)

  // Update deprecated contract content
  let deprecatedContent = originalContent
  // Update contract name
  deprecatedContent = deprecatedContent.replace(
    new RegExp(`contract ${contractName}( is| {)`),
    `contract ${contractName}V${nextVersion}$1`,
  )
  // Update import paths
  deprecatedContent = updateImportPaths(deprecatedContent)

  // Write deprecated version
  fs.writeFileSync(deprecatedPath, deprecatedContent)

  // Update main contract
  const updatedContent = updateVersionHistory(originalContent, nextVersion + 1, description)
  fs.writeFileSync(contractPath, updatedContent)

  console.log(`📁 Contract ${contractName}: V${currentVersion || "main"} -> V${nextVersion}`)
  return nextVersion
}

/**
 * Deprecates a contract and all its related contracts (interfaces, core, librairies)
 * @param contractPath Path to the contract to deprecate
 * @param description Description of what's new in this version
 */
async function deprecateContractAndRelated(contractPath: string, description: string) {
  const contractDir = path.dirname(contractPath)
  const projectRoot = path.resolve(contractDir, "..")
  const deprecatedDir = path.join(projectRoot, "contracts/deprecated")

  // Find all related contracts
  const relatedContracts = findRelatedContracts(contractPath)
  console.log("\n📦 Found related contracts:", relatedContracts.length ? relatedContracts : "none")

  // It needs to deprecated every contracts in order for it to work
  // Deprecate related contracts first
  // if (relatedContracts.length > 0) {
  //   console.log("\n🔄 Deprecating related contracts...")
  //   for (const relatedPath of relatedContracts) {
  //     deprecateContract(relatedPath, `Updated with ${path.basename(contractPath)}`, deprecatedDir)
  //   }
  // }

  // Deprecate the main contract
  console.log("\n🎯 Deprecating main contract...")
  const mainVersion = deprecateContract(contractPath, description, deprecatedDir)

  console.log("\n✅ Deprecation completed successfully!")
  console.log(`📝 Main contract updated to version ${mainVersion + 1}`)
}

// Add command line support
if (require.main === module) {
  const contractPath = process.argv[2]
  const description = process.argv[3]
  if (!contractPath || !description) {
    console.error("Please provide both contract path and description")
    console.error('Usage: yarn deprecate <contract-path> "Description of what\'s new"')
    process.exit(1)
  }
  deprecateContractAndRelated(contractPath, description)
}

export { deprecateContractAndRelated }
