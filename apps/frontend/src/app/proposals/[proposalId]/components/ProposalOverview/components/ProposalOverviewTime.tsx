import { ProposalState } from "@/api"
import { timestampToTimeLeftCompact } from "@/utils"
import { Box, HStack, Text } from "@chakra-ui/react"
import { UilClockEight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"

export const ProposalOverviewTime = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  if (proposal.isStateLoading) return null

  switch (proposal.state) {
    case ProposalState.Succeeded:
      return (
        <Box>
          <Text fontWeight={"400"}>{t("Finished")}</Text>
          <HStack>
            <UilClockEight />
            <Text>{t("{{time}} ago", { time: timestampToTimeLeftCompact(proposal.votingEndDate) })}</Text>
          </HStack>
        </Box>
      )

    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <Box>
            <Text fontWeight={"400"} color="#6A6A6A">
              {t("Starts in")}
            </Text>
            <HStack color="#004CFC">
              <UilClockEight size="20px" />
              <Text fontWeight={600}>{timestampToTimeLeftCompact(proposal.votingStartDate)}</Text>
            </HStack>
          </Box>
        )
      }
      return (
        <Box>
          <Text fontWeight={"400"}>{t("Starts in")}</Text>
          <HStack>
            <UilClockEight size="20px" />
            <Text fontWeight={600}>{timestampToTimeLeftCompact(proposal.votingStartDate)}</Text>
          </HStack>
        </Box>
      )
    case ProposalState.Active:
      return (
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Finish in")}
          </Text>
          <HStack>
            <UilClockEight />
            <Text>{timestampToTimeLeftCompact(proposal.votingEndDate)}</Text>
          </HStack>
        </Box>
      )
    default:
      return null
  }
}
