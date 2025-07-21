import { HexUtils } from "@repo/utils"
import { isHexString } from "ethers"

export const isValid = (appId: string): boolean => {
  try {
    const appIdFormatted = HexUtils.addPrefix(appId)
    return isHexString(appIdFormatted, 32)
  } catch {
    return false
  }
}
