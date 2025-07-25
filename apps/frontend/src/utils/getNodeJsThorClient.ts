import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"

export const getNodeJsThorClient = async () => {
  return ThorClient.at(getConfig().nodeUrl)
}
