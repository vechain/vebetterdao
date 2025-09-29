import { useCallback, useMemo } from "react"
import { GalaxyMember__factory } from "@vechain/vebetterdao-contracts/factories/GalaxyMember__factory"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getLevelOfTokenQueryKey, getNFTMetadataUriQueryKey, getUserGMsQueryKey } from "@/api"
import { getB3trDonatedQueryKey } from "./useB3trDonated"
import { getB3trToUpgradeQueryKey } from "./useB3trToUpgrade"

import { B3TR__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { ethers } from "ethers"
import { useWallet } from "@vechain/vechain-kit"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()
const B3trInterface = B3TR__factory.createInterface()
const galaxyMemberContractAddress = getConfig().galaxyMemberContractAddress

type Props = { tokenId: string; b3trToUpgrade: string; onSuccess?: () => void }

/**
 * Hook to upgrade a Galaxy Member NFT token
 * @param tokenId  the token id to upgrade
 * @param onSuccess  the callback to call after the token is upgraded
 * @returns the upgrade transaction
 */
export const useUpgradeGM = ({ tokenId, b3trToUpgrade, onSuccess }: Props) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trContractAddress,
        contractInterface: B3trInterface,
        method: "approve",
        args: [galaxyMemberContractAddress, ethers.parseEther(b3trToUpgrade.toString())],
        comment: `Approve B3TR tokens to upgrade Galaxy Member token ${tokenId}`,
      }),
      buildClause({
        to: galaxyMemberContractAddress,
        contractInterface: GalaxyMemberInterface,
        method: "upgrade",
        args: [tokenId],
        comment: `Upgrade Galaxy Member token ${tokenId}`,
      }),
    ]
  }, [b3trToUpgrade, tokenId])

  const refetchQueryKeys = useMemo(
    () => [
      getLevelOfTokenQueryKey(tokenId),
      getB3trToUpgradeQueryKey(tokenId),
      getB3trBalanceQueryKey(account?.address ?? ""),
      getB3trDonatedQueryKey(tokenId),
      getNFTMetadataUriQueryKey(tokenId),
      getUserGMsQueryKey(account?.address ?? ""),
    ],
    [account, tokenId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
