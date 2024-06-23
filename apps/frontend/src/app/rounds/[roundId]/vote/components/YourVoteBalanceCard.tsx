import { useAllocationsRound, useVot3PastSupply } from "@/api"
import { VOT3Icon } from "@/components"
import { Card, CardBody, VStack, Heading, Box, HStack, Skeleton, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)
type Props = {
  roundId: string
}

export const YourVoteBalanceCard = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const { data: roundInfo } = useAllocationsRound(roundId)
  const votesAtSnapshotQuery = useVot3PastSupply(roundInfo.voteStart)

  return (
    <Card variant={"baseWithBorder"} w="full">
      <CardBody>
        <VStack spacing={8} align="flex-start">
          <Heading fontSize="24px" fontWeight={700}>
            {t("Your V0T3 balance")}
          </Heading>
          <Box>
            <HStack spacing={2}>
              <VOT3Icon boxSize={"24px"} colorVariant="dark" />
              <Skeleton isLoaded={!votesAtSnapshotQuery.isLoading}>
                <Heading fontSize="28px" fontWeight={700}>
                  {compactFormatter.format(Number(votesAtSnapshotQuery.data) ?? 0)}
                </Heading>
              </Skeleton>
            </HStack>
            <Text fontSize="14px" fontWeight={400} color="#6A6A6A">
              {t("VOT3 balance at snapshot")}
            </Text>
          </Box>
          <Box fontSize={"14px"} color={"#6A6A6A"} fontWeight={400}>
            <Text fontWeight={600}>{t("We use the quadratic formula to calculate the results")}</Text>
            <Text>
              {t(
                "To aim for the equality of the voting process, we use quadratic voting, which divide your total amount of VOT3 for the square root.",
              )}
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}
