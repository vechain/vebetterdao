import { useVot3TokenDetails } from "@/api"
import { scaleNumberDown } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"

export const useScaleVot3Amount = () => {
  const vot3Token = useVot3TokenDetails()

  const scaleVot3Amount = useCallback(
    (amount?: string | number) => {
      return scaleNumberDown(amount || 0, vot3Token.data?.decimals || 18, vot3Token.data?.decimals || 18)
    },
    [vot3Token.data?.decimals],
  )

  return scaleVot3Amount
}
