import { createLocalConfig } from "./local"
export function createE2EConfig() {

  console.log("Creating E2E config...")
  const localConfig = createLocalConfig()
  localConfig.EMISSIONS_CYCLE_DURATION = 24  // 24 blocks - 4 minutes.
  return localConfig


}
