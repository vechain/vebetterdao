import { execFile } from "node:child_process"
import { access, mkdir, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { extensionZipPath } from "../config"

const execFileAsync = promisify(execFile)
const unpackDir = path.join(os.tmpdir(), "b3tr-e2e-veworld")

let cachedExtensionPath: string | undefined

const hasManifest = async (candidatePath: string) => {
  try {
    await access(path.join(candidatePath, "manifest.json"))
    return true
  } catch {
    return false
  }
}

export const ensureVeWorldExtensionPath = async () => {
  if (cachedExtensionPath) return cachedExtensionPath

  try {
    await access(extensionZipPath)
  } catch {
    throw new Error(`VeWorld extension zip not found at "${extensionZipPath}"`)
  }

  await rm(unpackDir, { recursive: true, force: true })
  await mkdir(unpackDir, { recursive: true })
  await execFileAsync("unzip", ["-o", extensionZipPath, "-d", unpackDir])

  const directoryEntries = await readdir(unpackDir, { withFileTypes: true })
  const candidatePaths = [
    unpackDir,
    ...directoryEntries.filter(entry => entry.isDirectory()).map(entry => path.join(unpackDir, entry.name)),
  ]

  for (const candidatePath of candidatePaths) {
    if (await hasManifest(candidatePath)) {
      cachedExtensionPath = candidatePath
      return cachedExtensionPath
    }
  }

  throw new Error(`VeWorld manifest.json not found in "${extensionZipPath}"`)
}
