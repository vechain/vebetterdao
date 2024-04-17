import { createLocalConfig } from "./local"
export function createE2EConfig() {

  console.log("Creating E2E config...")
  const localConfig = createLocalConfig()
  localConfig.EMISSIONS_CYCLE_DURATION = process.env.CI ? 48 : 24  // 36 blocks in CI (8 mins) minutes, 24 blocks in local (4 mins)
  localConfig.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE=20  // 20 -> Need 20% of total supply to succeed = 100 votes
  return localConfig


}
