import { HStack, Icon, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { LuUserRound } from "react-icons/lu"

import { useGetVetDomains } from "@/hooks/useGetVetDomains"

interface ChallengeCreatorChipProps {
  creator: string
  noBackground?: boolean
}

export const ChallengeCreatorChip = ({ creator, noBackground = false }: ChallengeCreatorChipProps) => {
  const router = useRouter()
  const { data: vetDomains } = useGetVetDomains(creator ? [creator] : undefined)
  const displayName = vetDomains?.[0] ?? humanAddress(creator, 6, 4)

  return (
    <HStack
      w="fit-content"
      gap="1"
      bg={noBackground ? "transparent" : "bg.secondary"}
      borderRadius="full"
      px={noBackground ? "0" : "2"}
      py="0.5"
      align="center"
      cursor="pointer"
      position="relative"
      zIndex={1}
      _hover={{ opacity: 0.7 }}
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        router.push(`/profile/${creator}`)
      }}>
      <Icon as={LuUserRound} boxSize="3" />
      <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
        {displayName}
      </Text>
    </HStack>
  )
}
