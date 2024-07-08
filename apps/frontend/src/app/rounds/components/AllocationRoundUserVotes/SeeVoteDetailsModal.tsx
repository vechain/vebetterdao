import { CustomModalContent } from "@/components"
import { Heading, Modal, ModalOverlay, Text, VStack } from "@chakra-ui/react"
import { AppVotesHorizontalChart } from "../AllocationXAppsVotesCard/AppVotesHorizontalChart"
import { Trans, useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"

type Props = {
  roundId: string
  votes: {
    appId: string
    value: string | number
    rawValue: number
  }[]
  isOpen: boolean
  onClose: () => void
}

const compactFormatter = getCompactFormatter(2)

export const SeeVoteDetailsModal = ({ roundId, votes, isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const sortedVotes = useMemo(() => votes.sort((a, b) => b.rawValue - a.rawValue), [votes])
  const totalVotesCast = useMemo(() => sortedVotes.reduce((acc, vote) => acc + vote.rawValue, 0), [sortedVotes])
  const totalAppsVoted = sortedVotes.length
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"xl"} trapFocus={true} isCentered={true} closeOnOverlayClick={true}>
      <ModalOverlay />
      <CustomModalContent>
        <VStack spacing={4} w="full" align="flex-start" p={"24px"}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Your votes")}
          </Heading>
          <Text fontSize="16px" fontWeight="400">
            <Trans
              i18nKey={"{{amount}} distributed among {{apps}} apps"}
              values={{ amount: compactFormatter.format(totalVotesCast ?? 0), apps: totalAppsVoted }}
              t={t}
            />
          </Text>
          <VStack spacing={6} mt={2} w="full" align="flex-start">
            {sortedVotes.map((vote, index) => (
              <AppVotesHorizontalChart
                key={index}
                roundId={roundId}
                data={{ votes: vote.value, app: vote.appId }}
                totalVotes={totalVotesCast.toString()}
              />
            ))}
          </VStack>
        </VStack>
      </CustomModalContent>
    </Modal>
  )
}
