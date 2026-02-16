import { Card, Heading, HStack, Text, VStack, Flex } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGetUserGMs } from "../../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { usePotentialRewardsFromIndexer } from "../../../../../api/contracts/rewards/hooks/usePotentialRewardsFromIndexer"
import { useAllocationAmount } from "../../../../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useCurrentAllocationsRoundId } from "../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useGMLevelsOverview } from "../../../../../api/indexer/gm/useGMLevelsOverview"
import { useGMPoolAmount } from "../../../../../hooks/galaxyMember/useGMPoolAmount"

const compactFormatter = getCompactFormatter(2)

export const GmPoolAmountCard = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { formatted: gmPoolAmount } = useGMPoolAmount(Number(currentRoundId))

  const { data: userGms } = useGetUserGMs()
  const usersGM = userGms?.find(gm => gm.isSelected)
  const { data: gmLevelOverview } = useGMLevelsOverview()

  const nextRoundId = useMemo(() => (Number(currentRoundId) + 1).toString(), [currentRoundId])
  const { data: emissionAmountCurrent } = useAllocationAmount(currentRoundId ?? "")
  const { data: emissionAmountNext } = useAllocationAmount(nextRoundId)
  const emissionAmount = Number(emissionAmountCurrent?.gm) === 0 ? emissionAmountNext : emissionAmountCurrent
  const emissionAmountGmRewards = Number(emissionAmount?.gm) || 0

  const { currentRewards } = usePotentialRewardsFromIndexer(
    gmLevelOverview || [],
    emissionAmountGmRewards,
    usersGM?.tokenLevel ?? "",
    usersGM?.tokenLevel,
  )

  return (
    <Card.Root variant="primary" border="sm" borderColor="border.active">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack gap={2}>
            <Heading textStyle="lg">{t("Total GM rewards for the current round")}</Heading>
          </HStack>
          <Flex borderRadius="md" justify="start" align="left" direction="column">
            <Text textStyle="2xl">
              {gmPoolAmount} {"B3TR"}
            </Text>
          </Flex>

          <HStack justify="left" gap={2}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Your estimated rewards:")} {compactFormatter.format(currentRewards)} {"B3TR"}
            </Text>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
