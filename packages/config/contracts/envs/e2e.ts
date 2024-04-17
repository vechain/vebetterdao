import { createLocalConfig } from "./local"
export function createE2EConfig() {

  console.log("Creating E2E config...")
  const localConfig = createLocalConfig()
  localConfig.EMISSIONS_CYCLE_DURATION = process.env.CI ? 36 : 24  // 36 blocks in CI (6 mins) minutes, 24 blocks in local (4 mins)
  return localConfig


}
