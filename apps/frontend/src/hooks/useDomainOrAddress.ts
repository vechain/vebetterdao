import { humanAddress } from "@repo/utils/FormattingUtils"

export const useDomainOrAddress = (domain: string, profile: string) => {
  return domain?.trim() ? domain : humanAddress(profile ?? "", 6, 3)
}
