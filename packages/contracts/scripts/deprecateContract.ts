import fs from "fs"
import path from "path"

/**
 * Finds the contract in version folders
 * @param contractName Base name of the contract
 * @param deprecatedDir Path to the deprecated directory
 * @returns The version number where contract was found, or 0 if not found
 */
function findContractVersion(contractName: string, deprecatedDir: string): number {
  if (!fs.existsSync(deprecatedDir)) {
    return 0
  }

  // Get all version folders
  const versionDirs = fs
    .readdirSync(deprecatedDir)
    .filter(dir => dir.startsWith("V"))
    .sort((a, b) => {
      const vA = parseInt(a.substring(1))
      const vB = parseInt(b.substring(1))
      return vB - vA // From higher to lower versio (descending order)
    })

  // Look for the contract in each version folder, starting from latest
  for (const vDir of versionDirs) {
    const version = parseInt(vDir.substring(1))
    const versionedContractName = `${contractName}V${version}.sol`
    const contractPath = path.join(deprecatedDir, vDir, versionedContractName)

    if (fs.existsSync(contractPath)) {
      return version
    }
  }

  return 0
}

/**
 * Updates version history in comments
 * @param content Contract content
 * @param newVersion New version number
 * @param description Description of the new version
 */
function updateVersionHistory(content: string, newVersion: number, description: string): string {
  // Find the first comment block that contains version history
  const versionPattern = /----- Version \d+ -----/
  const match = content.match(versionPattern)

  if (!match) {
    throw new Error("Could not find version history in contract")
  }

  // Find the end of the comment block containing version history
  const startIndex = content.lastIndexOf("/**", match.index)
  if (startIndex === -1) {
    throw new Error("Could not find start of version comment block")
  }

  const endIndex = content.indexOf("*/", startIndex)
  if (endIndex === -1) {
    throw new Error("Could not find end of version comment block")
  }

  // Add new version entry before the end of comment block
  const newVersionEntry = `\n * ----- Version ${newVersion} -----\n * - ${description}\n `

  return content.substring(0, endIndex) + newVersionEntry + content.substring(endIndex)
}

/**
 * Deprecates a contract by copying it to the deprecated folder with version increment
 * @param contractPath Path to the contract to deprecate
 * @param description Description of what's new in this version
 */
async function deprecateContract(contractPath: string, description: string) {
  // Read the contract file
  const contractContent = fs.readFileSync(contractPath, "utf8")
  const contractName = path.basename(contractPath, ".sol")
  const deprecatedDir = path.join(path.dirname(contractPath), "../deprecated")

  // Find the current version of the contract in deprecated folders
  const currentVersion = findContractVersion(contractName, deprecatedDir)
  const nextVersion = currentVersion + 1

  // Create next version folder if it doesn't exist
  const versionDir = path.join(deprecatedDir, `V${nextVersion}`)
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true })
  }

  // Create the deprecated contract name
  const deprecatedContractName = `${contractName}V${nextVersion}.sol`
  const deprecatedPath = path.join(versionDir, deprecatedContractName)

  // Update the contract content for deprecated version
  let deprecatedContent = contractContent
    // Update contract name
    .replace(new RegExp(`contract ${contractName}( is| {)`), `contract ${contractName}V${nextVersion}$1`)
    // Update version function if it exists
    .replace(/return ["']\d+["'];/, `return "${nextVersion}";`)

  // Write the deprecated version
  fs.writeFileSync(deprecatedPath, deprecatedContent)

  // Update the original contract with new version
  let updatedContent = updateVersionHistory(contractContent, nextVersion + 1, description)
    // Update version function if it exists
    .replace(/return ["']\d+["'];/, `return "${nextVersion + 1}";`)

  // Write the updated original contract
  fs.writeFileSync(contractPath, updatedContent)

  console.log(`✅ Contract deprecated successfully!`)
  console.log(`📁 Found contract in V${currentVersion || "main"} folder`)
  console.log(`📁 Created V${nextVersion} version at: ${deprecatedPath}`)
  console.log(`📝 Original contract updated to version ${nextVersion + 1}`)
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
