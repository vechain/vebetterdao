import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useMemo } from "react"

import { useGetVot3Balance } from "../../../../hooks/useGetVot3Balance"
import { useGetB3trBalance } from "../../../../hooks/useGetB3trBalance"

/**
 * return the total balance of Vot3 + B3tr
 * @param address for the account
 * @returns the total balance of Vot3 + B3tr
 */
export const useTotalBalance = (address?: string) => {
  const { account } = useWallet()
  const { data: b3trBalance } = useGetB3trBalance(address ?? account?.address)
  const { data: vot3Balance } = useGetVot3Balance(address ?? account?.address)
  return useMemo(() => {
    if (!b3trBalance || !vot3Balance) {
      return {
        original: "0",
        scaled: "0",
        formatted: "0",
      }
    }
    const original = Number(b3trBalance.original) + Number(vot3Balance.original)
    const scaled = ethers.formatEther(BigInt(original))
    const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
    return {
      original,
      scaled,
      formatted,
    }
  }, [b3trBalance, vot3Balance])
}
