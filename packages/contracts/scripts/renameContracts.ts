import fs from "fs"
import path from "path"

/**
 * Renames all contract and interface files in a given directory (recursively) by appending the provided version (e.g., V1).
 * Also updates the file contents to reflect the new contract names and handles import statements accordingly.
 * Skips files that are in the whitelist.
 *
 * @param {string} directoryPath - Relative path to the directory containing the contracts/interfaces.
 * @param {string} version - The version to append to the contract/interface names (e.g., "1" for V1).
 * @param {string[]} contractsWhitelist - Array of contract names to skip from renaming (without file extensions, e.g., ["B3TR"]).
 * @param {string[]} interfacesWhitelist - Array of interface names to skip from renaming (without file extensions, e.g., ["IERC6372"]).
 *
 * @throws Will throw an error if the directory does not exist or if a file read/write fails.
 */
function renameContractsAndInterfaces(
  directoryPath: string,
  version: string,
  contractsWhitelist: string[],
  interfacesWhitelist: string[],
): void {
  try {
    const contractsPath = path.join(__dirname, "..", "contracts", directoryPath)

    const renameFilesRecursively = (currentPath: string): void => {
      const files: string[] = fs.readdirSync(currentPath)

      files.forEach((file: string) => {
        const fullPath = path.join(currentPath, file)
        const stat = fs.lstatSync(fullPath)

        // If it's a directory, recurse into it
        if (stat.isDirectory()) {
          renameFilesRecursively(fullPath)
        } else if (file.endsWith(".sol")) {
          const fileNameWithoutExt = file.replace(".sol", "")

          // Skip files in the whitelist
          if (contractsWhitelist.includes(fileNameWithoutExt)) {
            console.log(`Skipping whitelist file: ${file}`)
            return
          }

          let content: string = fs.readFileSync(fullPath, "utf8")

          // Define the new file name with version
          const newName = file.replace(".sol", `V${version}.sol`)

          // Gather import names to update occurrences
          const importRenames: { originalName: string; newName: string }[] = []

          // Update imports (ignore imports starting with '@')
          content = content.replace(
            /import\s+{([^}]+)}\s+from\s+["'](.+)\.sol["']/g,
            (match: string, imports: string, importPath: string) => {
              if (!importPath.startsWith("@")) {
                const updatedImports: string = imports
                  .split(",")
                  .map((imp: string) => {
                    const originalName = imp.trim()

                    // Skip whitelisted imports
                    if (interfacesWhitelist.includes(originalName)) {
                      return originalName
                    }

                    const newName = `${originalName}V${version}`
                    importRenames.push({ originalName, newName }) // Track names to replace later
                    return newName
                  })
                  .join(", ")
                return `import { ${updatedImports} } from "${importPath}V${version}.sol"`
              }
              return match
            },
          )

          // Update simple import lines (without named imports)
          content = content.replace(/import\s+["'](.+)\.sol["']/g, (match: string, p1: string) => {
            if (!p1.startsWith("@")) {
              const importPath = p1.split("/").pop() || "" // Get the last part of the path (file name)
              const originalName = importPath.replace(".sol", "") // Extract the contract name without extension

              // Skip whitelisted imports
              if (interfacesWhitelist.includes(originalName)) {
                return match
              }

              const newName = `${originalName}V${version}` // Append version to contract name
              importRenames.push({ originalName, newName }) // Track it for later usage replacement
              return `import "${p1}V${version}.sol"`
            }
            return match
          })

          // Only update `contract`, `interface` or `library` declarations in the code (ignore comments)
          content = content.replace(
            /(^\s*)(contract|interface|library|abstract contract)\s+(\w+)/gm, // Ensuring it doesn't happen inside a comment
            (match: string, prefix: string, type: string, name: string) => {
              if (interfacesWhitelist.includes(name)) {
                return match
              }

              // Add to import renames
              importRenames.push({ originalName: name, newName: `${name}V${version}` })

              return `${prefix}${type} ${name}V${version}`
            },
          )

          // Replace instances of the imported interfaces and contracts in the content
          importRenames.forEach(({ originalName, newName }) => {
            // Create a regex that only matches if the original name is not preceded by a dot
            const usagePattern = new RegExp(`(?<!\\.)\\b${originalName}\\b`, "g")
            content = content.replace(usagePattern, newName)
          })

          // Write updated content to new file
          fs.writeFileSync(path.join(currentPath, newName), content)

          // Delete old file
          fs.unlinkSync(fullPath)

          console.log(`Renamed and updated: ${file} -> ${newName}`)
        }
      })
    }

    // Start recursive renaming
    renameFilesRecursively(contractsPath)
  } catch (error) {
    console.error(`Error processing directory '${directoryPath}': ${error}`)
    process.exit(1)
  }
}

// Script execution

/**
 * Parses arguments passed via command line and executes the renaming function.
 * Expects exactly two arguments: the path to the contracts directory and the version string.
 */
function run(): void {
  const args: string[] = process.argv.slice(2)

  if (args.length !== 2) {
    console.error("Usage: <path> <version>")
    process.exit(1)
  }

  const [directoryPath, version] = args

  // Validate the version format (e.g., allow numbers only)
  if (!/^\d+$/.test(version)) {
    console.error("Invalid version format. Only numeric values are allowed (e.g., 1, 2, 3).")
    process.exit(1)
  }

  // Whitelist of contract names that should not be renamed (without ".sol" extension)
  const contractsWhitelist: string[] = ["B3TR", "B3TRProxy"]

  const interfacesWhitelist: string[] = ["IERC6372", "Checkpoints"]

  renameContractsAndInterfaces(directoryPath, version, contractsWhitelist, interfacesWhitelist)
}

run()
