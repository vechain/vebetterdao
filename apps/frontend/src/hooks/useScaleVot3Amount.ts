import { useVot3TokenDetails } from "@/api"
import { scaleNumberDown } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"

/**
 * Hook to scale a VOT3 amount down to the token's decimals
 * @returns the function to scale a VOT3 amount down
 */
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
