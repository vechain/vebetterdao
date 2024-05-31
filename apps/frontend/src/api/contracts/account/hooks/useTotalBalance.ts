import { useMemo } from "react"
import { useB3trBalance, useB3trTokenDetails } from "../../b3tr"
import { useVot3Balance } from "../../vot3"
import { FormattingUtils } from "@repo/utils"

/**
 * return the total balance of Vot3 + B3tr
 * @param address for the account
 * @returns the total balance of Vot3 + B3tr
 */

export const useTotalBalance = (address?: string) => {
  const { data: b3trBalance } = useB3trBalance(address)
  const { data: vot3Balance } = useVot3Balance(address)
  const { data: tokenDetails } = useB3trTokenDetails()

  return useMemo(() => {
    if (!b3trBalance || !vot3Balance) {
      return {
        original: "0",
        scaled: "0",
        formatted: "0",
      }
    }

    const original = Number(b3trBalance.original) + Number(vot3Balance.original)
    const scaled = FormattingUtils.scaleNumberDown(original, tokenDetails?.decimals ?? 18)
    const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

    return {
      original,
      scaled,
      formatted,
    }
  }, [b3trBalance, vot3Balance, tokenDetails])
}
