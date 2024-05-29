import { useCurrentProposal } from "@/api"
import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter()

export const ProposalQuorumStatus = () => {
  const { t } = useTranslation()
  const { proposal } = useCurrentProposal()
  return (
    <VStack align="stretch">
      <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
        {t("Quorum status")}
      </Text>
      <HStack justify={"space-between"} align={"baseline"}>
        <HStack gap={2}>
          <Image h="20px" w="20px" src="/images/vot3-token.png" alt="vot3-token" />
          <Text fontSize="24px" fontWeight={700}>
            {compactFormatter.format(Number(proposal.totalVotes))}
          </Text>
        </HStack>
        <Text fontWeight={400} fontSize={"14px"} color="#004CFC">
          {compactFormatter.format(Number(proposal.quorumPercentage * 100))}
          {t("%")}
        </Text>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="8px" rounded="full" />
        <Box
          bg="#004CFC"
          h="8px"
          rounded="full"
          w={`${Number(proposal.quorumChartPercentage)}%`}
          position="absolute"
          top={0}
          left={0}
        />
      </Box>
      <HStack>
        <Text color="#252525" fontWeight={600} fontSize={"14px"}>
          {`${compactFormatter.format(Number(proposal.quorum))} V3`}
        </Text>
        <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
          {t("needed for quorum")}
        </Text>
      </HStack>
    </VStack>
  )
}
