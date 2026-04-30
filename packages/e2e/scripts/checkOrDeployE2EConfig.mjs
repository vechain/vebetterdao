#!/usr/bin/env node
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, "../../..")
const E2E_NODE_URL = process.env.B3TR_E2E_LOCAL_NODE_URL ?? "http://localhost:8670"
const SNAPSHOT_DIR = path.join(REPO_ROOT, "packages/e2e/.snapshots")
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "baseline.tar.gz")
const E2E_CONFIG_PATH = path.join(REPO_ROOT, "packages/config/e2e.ts")
const COMPOSE_PROJECT = "b3tr-e2e"
const COMPOSE_FILE = path.join(REPO_ROOT, "packages/contracts/docker-compose.e2e.yaml")
const VOLUME_NAME = "thor-data-e2e"
const MOCK_PLACEHOLDER_ADDR = "0x45d5CA3f295ad8BCa291cC4ecd33382DE40E4FAc"

const sh = (cmd, opts = {}) => {
  console.log(`[e2e-prep] $ ${cmd}`)
  return execSync(cmd, { stdio: "inherit", cwd: REPO_ROOT, ...opts })
}

const isSoloUp = async () => {
  try {
    const res = await fetch(`${E2E_NODE_URL}/blocks/0`)
    return res.ok
  } catch {
    return false
  }
}

const waitForSolo = async (timeoutMs = 60_000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isSoloUp()) {
      console.log("[e2e-prep] E2E solo healthy.")
      return
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`E2E solo did not become healthy on ${E2E_NODE_URL} after restart`)
}

const fetchCode = async addr => {
  const res = await fetch(`${E2E_NODE_URL}/accounts/${addr}/code`)
  if (!res.ok) return "0x"
  const json = await res.json()
  return json.code ?? "0x"
}

const snapshotVolume = () => {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
  sh(`docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} stop`)
  sh(
    `docker run --rm -v ${VOLUME_NAME}:/data -v ${SNAPSHOT_DIR}:/backup alpine ` +
      `sh -c "cd /data && tar -czf /backup/baseline.tar.gz ."`,
  )
  sh(`docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} start`)
}

const restoreVolume = () => {
  sh(`docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} stop`)
  sh(
    `docker run --rm -v ${VOLUME_NAME}:/data -v ${SNAPSHOT_DIR}:/backup alpine ` +
      `sh -c "find /data -mindepth 1 -delete && tar -xzf /backup/baseline.tar.gz -C /data"`,
  )
  sh(`docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} start`)
}

const main = async () => {
  sh(`yarn workspace @repo/config check-or-generate-e2e-config`)

  if (!(await isSoloUp())) {
    console.error("\n[e2e-prep] E2E Thor solo not reachable on", E2E_NODE_URL)
    console.error("[e2e-prep] Run: make e2e-solo-up\n")
    process.exit(1)
  }

  const e2eContent = fs.readFileSync(E2E_CONFIG_PATH, "utf-8")
  const match = e2eContent.match(/challengesContractAddress["']?\s*:\s*["'](0x[0-9a-fA-F]+)["']/)
  const challengesAddr = match?.[1]
  const isMock = !challengesAddr || challengesAddr.toLowerCase() === MOCK_PLACEHOLDER_ADDR.toLowerCase()

  let needsDeploy = isMock || !fs.existsSync(SNAPSHOT_FILE)

  if (!needsDeploy && challengesAddr) {
    const code = await fetchCode(challengesAddr)
    if (!code || code === "0x") {
      console.log("[e2e-prep] Contracts referenced in e2e.ts are not present on the e2e solo. Will redeploy.")
      needsDeploy = true
    }
  }

  if (needsDeploy) {
    console.log("[e2e-prep] Running fresh deploy on e2e solo (port 8670)...")
    sh(`yarn workspace @vechain/vebetterdao-contracts deploy:e2e`)

    console.log("[e2e-prep] Creating baseline snapshot...")
    snapshotVolume()
    await waitForSolo()
  } else {
    console.log("[e2e-prep] Restoring baseline snapshot for deterministic state...")
    restoreVolume()
    await waitForSolo()
  }

  console.log("[e2e-prep] Ready.")
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
