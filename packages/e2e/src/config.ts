import path from "node:path"

export const repoRoot = path.resolve(__dirname, "../../..")
export const baseUrl = process.env.B3TR_E2E_BASE_URL ?? "http://localhost:3000"
export const extensionZipPath = process.env.VEWORLD_EXTENSION_ZIP_PATH ?? "chrome.zip"
export const walletPassword = process.env.B3TR_E2E_WALLET_PASSWORD ?? "myPassword123"
export const walletMnemonic =
  process.env.B3TR_E2E_WALLET_MNEMONIC ??
  process.env.MNEMONIC ??
  "denial kitchen pet squirrel other broom bar gas better priority spoil cross"
export const headless = process.env.B3TR_E2E_HEADLESS === "true"
export const localNodeUrl = process.env.B3TR_E2E_LOCAL_NODE_URL ?? "http://localhost:8669"
export const localNetworkName = process.env.B3TR_E2E_LOCAL_NETWORK_NAME ?? "b3tr-local"
