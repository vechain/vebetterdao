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
 * Checks if a contract is an interface
 * @param contractPath Path to the contract
 * @returns True if the contract is an interface
 */
function isInterface(contractPath: string): boolean {
  return (
    path.basename(contractPath).startsWith("I") &&
    (contractPath.includes("/interfaces/") || contractPath.includes("/interface/"))
  )
}

/**
 * Gets the version history from a contract's content
 * @param content Contract content
 * @returns Array of version entries, each containing version number and description
 */
function getVersionHistory(content: string): { version: number; description: string }[] {
  const commentStart = content.indexOf("/**")
  const commentEnd = content.indexOf("*/", commentStart)

  if (commentStart === -1 || commentEnd === -1) {
    return []
  }

  const commentBlock = content.substring(commentStart, commentEnd)
  // Look for version entries in the format: "----- Version X -----" followed by "- Description"
  const versionPattern = /-{5}\s*Version\s+(\d+)\s*-{5}[\s\n]+\*\s*-\s*([^\n]+)/g
  const versions: { version: number; description: string }[] = []

  let match
  while ((match = versionPattern.exec(commentBlock)) !== null) {
    const version = parseInt(match[1])
    const description = match[2].trim()
    if (version && description) {
      versions.push({ version, description })
    }
  }

  return versions.sort((a, b) => a.version - b.version)
}

/**
 * Updates version history in comments
 * @param content Contract content
 * @param newVersion New version number
 * @param description Description of the new version
 * @param previousVersions Previous version entries to include
 */
function updateVersionHistory(
  content: string,
  newVersion: number,
  description: string,
  previousVersions: { version: number; description: string }[] = [],
): string {
  // Find the comment block containing version history
  const commentStart = content.indexOf("/**")
  const commentEnd = content.indexOf("*/", commentStart)

  if (commentStart === -1 || commentEnd === -1) {
    return content
  }

  // Get the comment header (everything before the first version entry)
  const commentBlock = content.substring(commentStart, commentEnd)
  const firstVersionIndex = commentBlock.indexOf("----- Version")
  const headerContent = firstVersionIndex === -1 ? commentBlock : commentBlock.substring(0, firstVersionIndex)

  // Build the version history, including previous versions
  let versionHistory = ""
  for (const { version, description } of previousVersions) {
    versionHistory += `----- Version ${version} -----\n * - ${description}\n * `
  }
  versionHistory += `----- Version ${newVersion} -----\n * - ${description}`

  // Reconstruct the comment, ensuring proper formatting
  return (
    content.substring(0, commentStart) +
    "/**" +
    headerContent +
    versionHistory +
    "\n */" +
    content.substring(commentEnd + 2)
  ).replace(/\/\*\*\/\*\*/g, "/**") // Remove any double comment starts
}

/**
 * Gets the target directory for a deprecated contract
 * @param contractPath Original contract path
 * @param version Version number
 * @param deprecatedDir Base deprecated directory
 * @returns Path to the target directory
 */
function getDeprecatedTargetDir(contractPath: string, version: number, deprecatedDir: string): string {
  const isInterfaceFile = isInterface(contractPath)

  if (isInterfaceFile) {
    // For interfaces, maintain the interfaces directory structure
    const relativeDir = path.relative(
      path.resolve(deprecatedDir, ".."), // Go up one level from deprecated dir
      path.dirname(contractPath),
    )
    return path.join(deprecatedDir, `V${version}`, relativeDir)
  }

  // For regular contracts, just use the version directory
  return path.join(deprecatedDir, `V${version}`)
}

/**
 * Ensures a directory exists, creating it and its parents if necessary
 * @param dir Directory path to ensure
 */
function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Deprecates a single contract
 * @param contractPath Path to the contract
 * @param description Version description
 * @param deprecatedDir Path to deprecated directory
 * @returns The new version number
 */
async function deprecateSingleContract(
  contractPath: string,
  description: string,
  deprecatedDir: string,
): Promise<number> {
  const contractName = path.basename(contractPath, ".sol").replace(/V\d+$/, "") // Remove any version suffix
  const isInterfaceFile = isInterface(contractPath)

  // Find current version and source for deprecated version
  const currentVersion = findContractHighestVersion(contractName, deprecatedDir)
  const nextVersion = currentVersion > 0 ? currentVersion + 1 : 1
  const originalContent = fs.readFileSync(contractPath, "utf8")

  // Get existing version history
  const previousVersions = getVersionHistory(originalContent)

  // Get the target directory and ensure it exists
  const targetDir = getDeprecatedTargetDir(contractPath, nextVersion, deprecatedDir)
  ensureDirectoryExists(targetDir)

  // Create the deprecated contract name and update its content
  const deprecatedContractName = `${contractName}V${nextVersion}.sol`
  const deprecatedPath = path.join(targetDir, deprecatedContractName)

  // Update the contract content for deprecated version
  let deprecatedContent = originalContent
  if (!isInterfaceFile) {
    // Only update contract name and version for non-interface files
    deprecatedContent = deprecatedContent
      .replace(new RegExp(`contract ${contractName}(V\\d+)?( is| {)`), `contract ${contractName}V${nextVersion}$2`)
      .replace(/return ["']\d+["'];/, `return "${nextVersion}";`)
  }

  // Write the deprecated version
  fs.writeFileSync(deprecatedPath, deprecatedContent)

  // Update the original contract
  let updatedContent = originalContent
  if (!isInterfaceFile) {
    // Only update version history and version number for non-interface files
    updatedContent = updateVersionHistory(originalContent, nextVersion + 1, description, previousVersions).replace(
      /return ["']\d+["'];/,
      `return "${nextVersion + 1}";`,
    )
  }

  // Write the updated original contract
  fs.writeFileSync(contractPath, updatedContent)

  console.log(
    `📁 ${isInterfaceFile ? "Interface" : "Contract"} ${contractName}: V${currentVersion || "main"} -> V${nextVersion}`,
  )
  return nextVersion
}

/**
 * Deprecates a contract and all its related contracts (interfaces, core, librairies)
 * @param contractPath Path to the contract to deprecate
 * @param description Description of what's new in this version
 */
async function deprecateContract(contractPath: string, description: string) {
  const contractDir = path.dirname(contractPath)
  const projectRoot = path.resolve(contractDir, "..")
  const deprecatedDir = path.join(projectRoot, "contracts/deprecated")

  // Find all related contracts
  const relatedContracts = findRelatedContracts(contractPath)
  console.log("\n📦 Found related contracts:", relatedContracts.length ? relatedContracts : "none")

  // Deprecate related contracts first
  if (relatedContracts.length > 0) {
    console.log("\n🔄 Deprecating related contracts...")
    for (const relatedPath of relatedContracts) {
      await deprecateSingleContract(relatedPath, `Updated with ${path.basename(contractPath)}`, deprecatedDir)
    }
  }

  // Deprecate the main contract
  console.log("\n🎯 Deprecating main contract...")
  const mainVersion = await deprecateSingleContract(contractPath, description, deprecatedDir)

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
  deprecateContract(contractPath, description).catch(console.error)
}

export { deprecateContract }
