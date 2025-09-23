import { AppConfig } from "@repo/config"
import { ABIContract } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts"

export const getAllEligibleApps = async (thorClient: ThorClient, config: AppConfig): Promise<string[]> => {
  const allAppsResult = await thorClient.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    ABIContract.ofAbi(X2EarnApps__factory.abi).getFunction("allEligibleApps"),
    [],
  )
  return allAppsResult.result?.array?.[0] as string[]
}
