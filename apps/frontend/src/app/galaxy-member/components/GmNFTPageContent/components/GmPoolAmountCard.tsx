import { Card, Heading, HStack, Text, VStack, Flex, Icon } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGetUserGMs } from "../../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMMaxLevel } from "../../../../../api/contracts/galaxyMember/hooks/useGMMaxLevel"
import { usePotentialRewardsFromIndexer } from "../../../../../api/contracts/rewards/hooks/usePotentialRewardsFromIndexer"
import { useAllocationAmount } from "../../../../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useCurrentAllocationsRoundId } from "../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useGMLevelsOverview } from "../../../../../api/indexer/gm/useGMLevelsOverview"
import { gmNfts } from "../../../../../constants/gmNfts"
import { useGMPoolAmount } from "../../../../../hooks/galaxyMember/useGMPoolAmount"

const compactFormatter = getCompactFormatter(2)

export const GmPoolAmountCard = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { formatted: gmPoolAmount } = useGMPoolAmount(Number(currentRoundId))

  const { data: userGms } = useGetUserGMs()
  const usersGM = userGms?.find(gm => gm.isSelected)
  const { data: gmLevelOverview } = useGMLevelsOverview()
  const { data: maxGMLevel } = useGMMaxLevel()

  const currentLevelNum = Number(usersGM?.tokenLevel ?? 0)
  const isMaxLevel = currentLevelNum >= (maxGMLevel ?? 0)
  const nextLevelStr = (currentLevelNum + 1).toString()
  const nextLevelNft = gmNfts.find(nft => nft.level === nextLevelStr)

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

  const { potentialRewards: nextLevelRewards } = usePotentialRewardsFromIndexer(
    gmLevelOverview || [],
    emissionAmountGmRewards,
    nextLevelStr,
    usersGM?.tokenLevel,
  )

  const rewardIncrease = nextLevelRewards - currentRewards

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

          {!isMaxLevel && nextLevelNft && rewardIncrease > 0 && (
            <VStack align="stretch" gap={3} pt={2} borderTopWidth="1px" borderColor="border.primary">
              <HStack gap={2}>
                <Icon as={UilArrowCircleUp} boxSize="18px" color="brand.secondary" />
                <Text textStyle="sm" color="brand.secondary" fontWeight="semibold">
                  {t("Upgrade to {{name}} to earn ~{{amount}} more B3TR per round", {
                    name: nextLevelNft.name,
                    amount: compactFormatter.format(rewardIncrease),
                  })}
                </Text>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
