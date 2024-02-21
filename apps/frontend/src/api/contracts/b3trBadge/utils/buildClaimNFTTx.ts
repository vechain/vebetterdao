import { EnhancedClause } from "@/hooks"
import { getConfig } from "@repo/config"

import { B3TRBadge__factory } from "@repo/contracts"

const B3trBadgeInterface = B3TRBadge__factory.createInterface()

export const buildClaimNftTx = (thor: Connex.Thor): EnhancedClause => {
  return {
    to: getConfig().b3trContractAddress,
    value: 0,
    data: B3trBadgeInterface.encodeFunctionData("freeMint"),
    comment: `Claim NFT`,
    abi: JSON.parse(JSON.stringify(B3trBadgeInterface.getFunction("freeMint"))),
  }
}
