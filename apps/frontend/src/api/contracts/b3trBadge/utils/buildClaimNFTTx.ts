import { EnhancedClause } from "@/hooks"
import { getConfig } from "@repo/config"

import { B3trBadgeContractJson } from "@repo/contracts"
const b3trBadgeAbi = B3trBadgeContractJson.abi

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const buildClaimNftTx = (thor: Connex.Thor): EnhancedClause => {
  const functionAbi = b3trBadgeAbi.find(e => e.name === "freeMint")
  if (!functionAbi) throw new Error("Function abi not found for freeMint")

  return {
    ...thor.account(B3TR_BADGE_CONTRACT).method(functionAbi).asClause(),
    comment: `Claim NFT`,
    abi: functionAbi,
  }
}
