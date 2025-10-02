import { ProposalStatusBadge } from "@/components"
import { Box, HStack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { IoIosArrowForward } from "react-icons/io"
import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { useIsDepositReached } from "@/api"

type Props = {
  proposal: ProposalEnriched | GrantProposalEnriched
  isLoading: boolean
}

export const ProposalBox = ({ proposal, isLoading }: Props) => {
  const router = useRouter()

  const [isDesktop] = useMediaQuery(["(min-width: 500px)"])
  const { data: isDepositReached } = useIsDepositReached(proposal?.id ?? "")

  const title = useMemo(() => {
    if (!proposal?.title) return "Proposal title temporarily unavailable"

    if (isDesktop && proposal.title.length > 95) return proposal.title.slice(0, 95) + "..."
    if (!isDesktop && proposal.title.length > 38) return proposal.title.slice(0, 38) + "..."

    return proposal.title
  }, [proposal?.title, isDesktop])

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
          isDepositReached={isDepositReached ?? false}
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
