import { useVechainDomain } from "@vechain/vechain-kit"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { HStack, Text } from "@chakra-ui/react"
import { AddressIcon } from "@/components/AddressIcon"

export const AddressWithProfilePicture = ({ address }: { address: string }) => {
  const { data: vechainDomain } = useVechainDomain(address)
  const displayAddress = vechainDomain?.domain
    ? humanDomain(vechainDomain.domain, 18, 0)
    : humanAddress(address ?? "", 6, 3)
  return (
    <HStack gap={2} alignItems="center">
      <AddressIcon boxSize={4} borderRadius="full" address={address} />
      <Text>{displayAddress}</Text>
    </HStack>
  )
}
