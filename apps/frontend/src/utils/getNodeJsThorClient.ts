import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/vechain-kit"

export const getNodeJsThorClient = async () => {
  return ThorClient.at(getConfig().nodeUrl)
}
