import { getConfig } from "@repo/config"
import { X2EarnCreator__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause } from "@vechain/vechain-kit"

const address = getConfig().x2EarnCreatorContractAddress as `0x${string}`
const abi = X2EarnCreator__factory.abi

export const useIsSelfMintEnabled = () => {
  return useCallClause({
    abi,
    address,
    method: "selfMintEnabled",
    args: [],
    queryOptions: {
      select: data => Boolean(data[0]),
    },
  })
}
