import { Framework } from "@vechain/connex-framework"
import { Driver, SimpleNet } from "@vechain/connex-driver"
import { getConfig } from "@repo/config"

export const getNodeJsConnex = async () => {
  const net = new SimpleNet(getConfig().nodeUrl)
  const driver = await Driver.connect(net)

  // now we get the ready-to-use Connex instance object
  const connex = new Framework(driver)

  return connex
}
