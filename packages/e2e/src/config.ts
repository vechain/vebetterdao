import path from "node:path"

const readMs = (envKey: string, defaultMs: number, min = 0, max = 60_000): number => {
  const raw = process.env[envKey]
  if (raw === undefined || raw === "") return defaultMs
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return defaultMs
  return Math.min(max, Math.max(min, n))
}

export const repoRoot = path.resolve(__dirname, "../../..")
export const baseUrl = process.env.B3TR_E2E_BASE_URL ?? "http://localhost:3001"
export const extensionZipPath = process.env.VEWORLD_EXTENSION_ZIP_PATH ?? "chrome.zip"
export const walletPassword = process.env.B3TR_E2E_WALLET_PASSWORD ?? "myPassword123"
export const walletMnemonic =
  process.env.B3TR_E2E_WALLET_MNEMONIC ??
  process.env.MNEMONIC ??
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross"
export const headless = process.env.B3TR_E2E_HEADLESS === "true"
export const localNodeUrl = process.env.B3TR_E2E_LOCAL_NODE_URL ?? "http://localhost:8670"
export const localNetworkName = process.env.B3TR_E2E_LOCAL_NETWORK_NAME ?? "b3tr-e2e"

/** Poll when VeWorld approve/sign UI is not on screen yet (extension popup / iframe). */
export const veworldTargetPollMs = readMs("B3TR_E2E_VEWORLD_TARGET_POLL_MS", 100, 50, 2000)
/** After extension password submit. */
export const veworldAfterPasswordMs = readMs("B3TR_E2E_VEWORLD_AFTER_PASSWORD_MS", 200, 0, 5000)
/** After connection Approve in extension. */
export const veworldAfterApproveMs = readMs("B3TR_E2E_VEWORLD_AFTER_APPROVE_MS", 120, 0, 5000)
/** After transaction Confirm/sign in extension. */
export const veworldAfterConfirmMs = readMs("B3TR_E2E_VEWORLD_AFTER_CONFIRM_MS", 120, 0, 5000)
/** When no VeWorld button matched this iteration (UI transitioning between steps). */
export const veworldIdleBetweenStepsMs = readMs("B3TR_E2E_VEWORLD_IDLE_MS", 150, 0, 5000)
