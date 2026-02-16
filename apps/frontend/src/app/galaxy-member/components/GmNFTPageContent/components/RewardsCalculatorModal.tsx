import { Card, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { gmNfts } from "@/constants/gmNfts"

import { useGetUserGMs } from "../../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useParticipatedInGovernance } from "../../../../../api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { usePotentialRewardsFromIndexer } from "../../../../../api/contracts/rewards/hooks/usePotentialRewardsFromIndexer"
import { useAllocationAmount } from "../../../../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useCurrentAllocationsRoundId } from "../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useGMLevelsOverview } from "../../../../../api/indexer/gm/useGMLevelsOverview"

import { GalaxyCarrousel } from "./GalaxyCarrousel"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const DECIMAL_PLACES = 2
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

export const RewardsCalculatorModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGms } = useGetUserGMs()
  const usersGM = userGms?.find(gm => gm.isSelected)
  const { data: gmLevelOverview } = useGMLevelsOverview()
  const [selectedGMLevel, setSelectedGMLevel] = useState<string>()
  const { data: currentRound } = useCurrentAllocationsRoundId()
  const nextRound = useMemo(() => (Number(currentRound) + 1).toString(), [currentRound])
  const { data: emissionAmountCurrent } = useAllocationAmount(currentRound ?? "")
  const { data: emissionAmountNext } = useAllocationAmount(nextRound)
  const isCurrentRoundEmpty = Number(emissionAmountCurrent?.gm) === 0
  const emissionAmount = isCurrentRoundEmpty ? emissionAmountNext : emissionAmountCurrent
  const effectiveRound = isCurrentRoundEmpty ? nextRound : currentRound
  const { data: hasVoted } = useParticipatedInGovernance(account?.address ?? "")
  const emissionAmount_gmRewards = Number(emissionAmount?.gm) || 0
  const { potentialRewards, currentRewards } = usePotentialRewardsFromIndexer(
    gmLevelOverview || [],
    emissionAmount_gmRewards,
    selectedGMLevel ?? "",
    usersGM?.tokenLevel,
  )

  const estimatedRewards = useMemo(() => {
    if (account && selectedGMLevel && emissionAmount_gmRewards) {
      return { potentialRewards, currentRewards }
    }
    return null
  }, [account, selectedGMLevel, emissionAmount_gmRewards, potentialRewards, currentRewards])

  const selectedGMName = gmNfts.find(nft => nft.level === selectedGMLevel)?.name

  if (!account || !hasVoted) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton modalContentProps={{ maxW: "3xl" }}>
      <Heading alignSelf="flex-start" pb={5}>
        {t("Rewards calculator")}
      </Heading>
      <VStack mt={6} gap={10} w="full" alignItems="center">
        <GalaxyCarrousel setSelectedGMLevel={setSelectedGMLevel} usersGM={usersGM} />

        <VStack gap={4} w="full" align="stretch">
          <Card.Root variant="subtle">
            <Card.Body gap={3}>
              <Heading size="xl">{t("Potential Rewards with {{name}}", { name: selectedGMName })}</Heading>
              <HStack alignItems="center" borderLeft="4px" borderColor="brand.secondary" pl={4}>
                <Image boxSize="7" rounded="full" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                <Text fontWeight="semibold" textStyle="4xl">
                  {compactFormatter.format(estimatedRewards?.potentialRewards ?? 0)}
                </Text>
              </HStack>
              <Text textStyle="sm" color="text.subtle">
                {t(
                  "What you could earn if you upgraded to this GM level. Estimates are based on round {{round}} data.",
                  { round: effectiveRound },
                )}
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="subtle">
            <Card.Body gap={3}>
              <Heading size="xl">{t("Estimated Rewards with your current GM level")}</Heading>
              <HStack alignItems="center" borderLeft="4px" borderColor="brand.secondary" pl={4}>
                <Image boxSize="7" rounded="full" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
                <Text fontWeight="semibold" textStyle="4xl">
                  {compactFormatter.format(Number(estimatedRewards?.currentRewards ?? 0))}
                </Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>

        <Text textStyle="sm" color="text.subtle">
          {t("Note: These are estimates and may change as more users vote or upgrade their NFTs.")}
        </Text>
      </VStack>
    </BaseModal>
  )
}
