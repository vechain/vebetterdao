import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { useCallClause } from "@vechain/vechain-kit"

const abi = Emissions__factory.abi
const address = getConfig().emissionsContractAddress
const method = "nextCycle" as const

export const useNextEmissionsCycle = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0].toString(),
    },
  })
}
