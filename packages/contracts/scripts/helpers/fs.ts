import fs from "fs"
import path from "path"

/**
 * Reads files from a directory and returns an array of `File` objects.
 *
 * @param dirPath - The path to the directory to read.
 * @returns A promise that resolves to an array of `File` objects.
 *
 * @throws An error if the directory does not exist.
 */
async function readFilesFromDirectory(dirPath: string): Promise<File[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  const files: File[] = []

  for (const entry of entries) {
    if (entry.isFile()) {
      const filePath = path.join(dirPath, entry.name)
      const content = await fs.promises.readFile(filePath)
      const mimeType = "image/png" // TODO: Get the MIME type from the file
      const file: File = new File([content], entry.name, { type: mimeType })
      files.push(file)
    }
  }

  return files
}

/**
 * Save the deployed contracts addresses to a file.
 * @param contracts - The deployed contracts
 * @param libraries - The deployed libraries
 */
async function saveContractsToFile(
  contracts: Record<string, string>,
  libraries: {
    B3TRGovernor: Record<string, string>
  },
): Promise<void> {
  const OUTPUT_PATH = path.join(__dirname, `../../deploy_output`)

  // Reset the output directory
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.rmSync(OUTPUT_PATH, { recursive: true })
  }
  // Ensure the output directory exists
  fs.mkdirSync(OUTPUT_PATH)

  await fs.promises.writeFile(`${OUTPUT_PATH}/contracts.txt`, JSON.stringify(contracts, null, 2))
  await fs.promises.writeFile(`${OUTPUT_PATH}/libraries.txt`, JSON.stringify(libraries, null, 2))
  console.log(`Contracts and libraries addresses saved to ${OUTPUT_PATH}`)
}

export { readFilesFromDirectory, saveContractsToFile }
