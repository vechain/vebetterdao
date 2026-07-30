export type PublicEnvKey =
  | "NEXT_PUBLIC_APP_ENV"
  | "NEXT_PUBLIC_APP_VERSION"
  | "NEXT_PUBLIC_DELEGATOR_URL"
  | "NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN"
  | "NEXT_PUBLIC_PRIVY_APP_ID"
  | "NEXT_PUBLIC_PRIVY_CLIENT_ID"
  | "NEXT_PUBLIC_TRANSAK_API_KEY"
  | "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"

export const PUBLIC_ENV_KEYS: readonly PublicEnvKey[] = [
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_APP_VERSION",
  "NEXT_PUBLIC_DELEGATOR_URL",
  "NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN",
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "NEXT_PUBLIC_PRIVY_CLIENT_ID",
  "NEXT_PUBLIC_TRANSAK_API_KEY",
  "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID",
]

export function getPublicEnv(key: PublicEnvKey): string {
  const g = globalThis as { __ENV__?: Record<string, string> }
  if (g.__ENV__) return g.__ENV__[key] ?? ""
  return process.env[key] ?? ""
}
