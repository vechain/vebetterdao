import { CustomModalContent } from "@/components"
import { Heading, Dialog, Text, VStack } from "@chakra-ui/react"
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
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} size={"xl"}>
      <CustomModalContent>
        <VStack gap={4} w="full" align="flex-start" p={"24px"}>
          <Heading size="2xl">{t("Your votes")}</Heading>
          <Text fontSize="16px" fontWeight="400">
            <Trans
              i18nKey={"{{amount}} distributed among {{apps}} apps"}
              values={{ amount: compactFormatter.format(totalVotesCast ?? 0), apps: totalAppsVoted }}
              t={t}
            />
          </Text>
          <VStack gap={6} mt={2} w="full" align="flex-start">
            {sortedVotes.map(vote => {
              const percentage = (vote.rawValue / totalVotesCast) * 100
              return (
                <AppVotesHorizontalChart
                  key={`vote-${vote.appId}-${vote.value}-${roundId}`}
                  roundId={roundId}
                  data={{ percentage, app: vote.appId }}
                  totalVotes={totalVotesCast.toString()}
                />
              )
            })}
          </VStack>
        </VStack>
      </CustomModalContent>
    </Dialog.Root>
  )
}
