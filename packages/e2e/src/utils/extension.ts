import { execFile } from "node:child_process"
import { access, mkdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { extensionZipPath } from "../config"

const execFileAsync = promisify(execFile)
const unpackDir = path.join(os.tmpdir(), "b3tr-e2e-veworld")

let cachedExtensionPath: string | undefined

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

  const resolvedExtensionPath = path.join(unpackDir, "veworld-dist")
  await access(path.join(resolvedExtensionPath, "manifest.json"))

  cachedExtensionPath = resolvedExtensionPath
  return cachedExtensionPath
}
