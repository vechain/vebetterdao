import { ProposalMetadata } from "@/api"
import { ProposalStatusBadge } from "@/components"
import { Box, HStack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { IoIosArrowForward } from "react-icons/io"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

type Props = {
  proposal: ProposalEnriched | GrantProposalEnriched
  metadata?: ProposalMetadata
  isLoading: boolean
}

export const ProposalBox = ({ proposal, metadata, isLoading }: Props) => {
  const router = useRouter()

  const [isDesktop] = useMediaQuery(["(min-width: 500px)"])

  const title = useMemo(() => {
    if (!metadata?.title) return "Proposal title temporarily unavailable"

    if (isDesktop && metadata.title.length > 95) return metadata.title.slice(0, 95) + "..."
    if (!isDesktop && metadata.title.length > 38) return metadata.title.slice(0, 38) + "..."

    return metadata.title
  }, [metadata?.title, isDesktop])

  const goToProposal = useCallback(() => {
    router.push(`/proposals/${proposal.id}`)
  }, [router, proposal.id])

  if (isLoading || proposal.state === undefined) {
    return null
  }

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
      <VStack w={"full"} alignItems={"start"} gap={2}>
        <ProposalStatusBadge
          proposalState={proposal.state}
          isDepositReached={false} //TODO: Implement this, fix the type expected
          textProps={{
            fontSize: 12,
          }}
          proposalType={proposal.type}
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
