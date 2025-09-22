import { AddressIcon } from "@/components/AddressIcon"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { HStack, LinkBox, Text } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

type Props = {
  address: string
}

export const AddressWithProfilePicture = ({ address }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()
  const { data: vechainDomain } = useVechainDomain(address)
  const isConnectedUser = compareAddresses(address, account?.address ?? "")

  const digitsBeforeEllipsis = isMobile ? 6 : 18
  const digitsAfterEllipsis = isMobile ? 3 : 0
  const displayAddress = vechainDomain?.domain
    ? humanDomain(vechainDomain.domain, digitsBeforeEllipsis, digitsAfterEllipsis)
    : humanAddress(address ?? "", digitsBeforeEllipsis, digitsAfterEllipsis)

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
