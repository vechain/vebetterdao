import { HStack, LinkBox, Text } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { AddressIcon } from "@/components/AddressIcon"
import { useBreakpoints } from "@/hooks/useBreakpoints"

type Props = {
  address: string
  truncateAddress?: boolean
}
export const AddressWithProfilePicture = ({ address, truncateAddress = true }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: vechainDomain } = useVechainDomain(address)
  const isConnectedUser = compareAddresses(address, account?.address ?? "")
  const digitsBeforeEllipsis = truncateAddress ? (isMobile ? 8 : 10) : 25
  const digitsAfterEllipsis = truncateAddress ? (isMobile ? 6 : 4) : 25
  const displayAddress = truncateAddress
    ? vechainDomain?.domain
      ? humanDomain(vechainDomain.domain, digitsBeforeEllipsis, digitsAfterEllipsis)
      : humanAddress(address ?? "", digitsBeforeEllipsis, digitsAfterEllipsis)
    : vechainDomain?.domain || address
  const handleClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation()
    router.push(`/profile/${address}`)
  }
  return (
    <LinkBox cursor="pointer" _hover={{ opacity: 0.7 }} onClick={handleClick}>
      <HStack gap={2} alignItems="center">
        <AddressIcon boxSize={4} borderRadius="full" address={address} />
        <Text>{isConnectedUser ? t("You") : displayAddress}</Text>
      </HStack>
    </LinkBox>
  )
}
