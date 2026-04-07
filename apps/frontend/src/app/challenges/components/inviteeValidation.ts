import { isValidAddress } from "@vechain/vechain-kit/utils"
import { TFunction } from "i18next"

export type ParsedInviteeValue = {
  normalizedValue: string
  isAddress: boolean
  isDomain: boolean
  resolvedAddress?: string
}

export type InviteeValidationError =
  | "invalid_wallet_address"
  | "invalid_wallet_address_or_domain"
  | "invalid_domain"
  | "invalid_address"
  | "creator_cannot_be_invited"
  | "already_invited"
  | "duplicate_address"

type GetInviteeValidationErrorArgs = {
  invitee: ParsedInviteeValue
  creatorAddress?: string
  existingInvitees?: ReadonlySet<string>
  resolvedInviteeCounts: ReadonlyMap<string, number>
  isResolvingDomains?: boolean
}

export const isVetDomain = (value: string) => {
  const normalizedValue = value.toLowerCase()
  return !normalizedValue.startsWith("0x") && normalizedValue.endsWith(".vet")
}

export const parseInviteeValues = (
  values: string[],
  resolvedDomainAddresses: Array<string | null | undefined> = [],
): ParsedInviteeValue[] => {
  let domainIndex = 0

  return values.map(value => {
    const normalizedValue = value.trim()
    const isAddress = isValidAddress(normalizedValue)
    const isDomain = isVetDomain(normalizedValue)
    const resolvedDomain = isDomain ? resolvedDomainAddresses[domainIndex++] : undefined

    return {
      normalizedValue,
      isAddress,
      isDomain,
      resolvedAddress: isAddress
        ? normalizedValue.toLowerCase()
        : typeof resolvedDomain === "string" && resolvedDomain
          ? resolvedDomain.toLowerCase()
          : undefined,
    }
  })
}

export const countResolvedInvitees = (invitees: ParsedInviteeValue[]) => {
  const counts = new Map<string, number>()

  for (const invitee of invitees) {
    if (!invitee.resolvedAddress) continue
    counts.set(invitee.resolvedAddress, (counts.get(invitee.resolvedAddress) ?? 0) + 1)
  }

  return counts
}

export const getSanitizedInvitees = (invitees: ParsedInviteeValue[]) =>
  invitees.map(invitee => invitee.resolvedAddress).filter((address): address is string => !!address)

export const getInviteeValidationError = ({
  invitee,
  creatorAddress,
  existingInvitees,
  resolvedInviteeCounts,
  isResolvingDomains = false,
}: GetInviteeValidationErrorArgs): InviteeValidationError | null => {
  if (!invitee.normalizedValue) return null
  if (invitee.normalizedValue.toLowerCase().startsWith("0x") && !invitee.isAddress) return "invalid_wallet_address"
  if (!invitee.isAddress && !invitee.isDomain) return "invalid_wallet_address_or_domain"
  if (invitee.isDomain && !invitee.resolvedAddress) return isResolvingDomains ? null : "invalid_domain"
  if (!invitee.resolvedAddress) return "invalid_address"
  if (creatorAddress && invitee.resolvedAddress === creatorAddress.toLowerCase()) return "creator_cannot_be_invited"
  if (existingInvitees?.has(invitee.resolvedAddress)) return "already_invited"
  if ((resolvedInviteeCounts.get(invitee.resolvedAddress) ?? 0) > 1) return "duplicate_address"
  return null
}

export const getInviteeValidationMessage = (t: TFunction, error: InviteeValidationError) => {
  switch (error) {
    case "invalid_wallet_address":
      return t("Please enter a valid wallet address")
    case "invalid_wallet_address_or_domain":
      return t("Please enter a valid wallet address or domain")
    case "invalid_domain":
      return t("Please enter a valid domain")
    case "invalid_address":
      return t("Invalid address")
    case "creator_cannot_be_invited":
      return t("Creator cannot be invited")
    case "already_invited":
      return t("Already invited")
    case "duplicate_address":
      return t("Duplicate address")
  }
}
