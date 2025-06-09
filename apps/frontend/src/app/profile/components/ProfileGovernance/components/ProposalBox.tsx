import { ProposalMetadata } from "@/api"
import { ProposalStatusBadge } from "@/components"
import { Box, HStack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { IoIosArrowForward } from "react-icons/io"

type Props = {
  proposalId: string
  metadata?: ProposalMetadata
}

export const ProposalBox = ({ proposalId, metadata }: Props) => {
  const router = useRouter()

  const [isDesktop] = useMediaQuery("(min-width: 500px)")

  const title = useMemo(() => {
    if (!metadata?.title) return "Proposal title temporarily unavailable"

    if (isDesktop && metadata.title.length > 95) return metadata.title.slice(0, 95) + "..."
    if (!isDesktop && metadata.title.length > 38) return metadata.title.slice(0, 38) + "..."

    return metadata.title
  }, [metadata?.title, isDesktop])

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposalId}`)
  }, [router, proposalId])

  return (
    <HStack
      onClick={goToProposal}
      w={"full"}
      borderRadius={12}
      cursor={"pointer"}
      bg={"profile-bg"}
      _hover={{
        bg: "hover-contrast-bg",
      }}
      p={{ base: 3, md: 4 }}>
      <VStack w={"full"} alignItems={"start"} spacing={2}>
        <ProposalStatusBadge
          proposalId={proposalId}
          textProps={{
            fontSize: 12,
          }}
        />
        <Text fontSize={14} fontWeight={"600"}>
          {title}
        </Text>
      </VStack>
      <Box boxSize={{ base: "16px", md: "24px" }} justifyContent={"center"} alignContent={"center"}>
        <IoIosArrowForward />
      </Box>
    </HStack>
  )
}
