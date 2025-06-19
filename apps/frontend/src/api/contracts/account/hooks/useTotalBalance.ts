import { useMemo } from "react"
import { FormattingUtils } from "@repo/utils"
import { ethers } from "ethers"
import { useGetB3trBalance, useGetVot3Balance } from "@vechain/vechain-kit"

/**
 * return the total balance of Vot3 + B3tr
 * @param address for the account
 * @returns the total balance of Vot3 + B3tr
 */

export const useTotalBalance = (address?: string) => {
  const { data: b3trBalance } = useGetB3trBalance(address)
  const { data: vot3Balance } = useGetVot3Balance(address)

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
