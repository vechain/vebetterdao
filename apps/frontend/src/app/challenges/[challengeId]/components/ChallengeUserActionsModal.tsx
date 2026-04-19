import { Badge, Button, HStack, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useRef } from "react"
import { Trans, useTranslation } from "react-i18next"

import { type ChallengeDetail } from "@/api/challenges/types"
import { useChallengeUserActions } from "@/api/challenges/useChallengeUserActions"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { BetterActionCard } from "@/components/TransactionCard/cards/BetterActionCard/BetterActionCard"

export interface ChallengeUserActionsParticipant {
  address: string
  position: number
  score: number
}

interface ChallengeUserActionsModalProps {
  onClose: () => void
  challenge: ChallengeDetail
  participant: ChallengeUserActionsParticipant | null
}

const EMPTY_PARTICIPANT: ChallengeUserActionsParticipant = { address: "", position: 0, score: 0 }
const SKELETON_COUNT = 3

/**
 * Always mount this component so BaseModal's useMediaQuery is pre-resolved
 * and doesn't flash the wrong layout on open. Pass participant=null to close.
 */
export const ChallengeUserActionsModal = ({ onClose, challenge, participant }: ChallengeUserActionsModalProps) => {
  const { t } = useTranslation()
  const isOpen = participant !== null

  const lastParticipantRef = useRef<ChallengeUserActionsParticipant>(EMPTY_PARTICIPANT)
  if (participant) lastParticipantRef.current = participant
  const display = lastParticipantRef.current

  const { data: vnsData } = useVechainDomain(display.address)
  const domain = vnsData?.domain

  const { actions, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useChallengeUserActions(
    challenge,
    isOpen ? display.address : undefined,
  )

  const displayName = domain ? humanDomain(domain, 16, 6) : humanAddress(display.address, 6, 4)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      ariaTitle={t("Actions in this quest")}
      modalBodyProps={{ maxH: "70vh", overflowY: "auto" }}>
      <VStack gap={4} align="stretch">
        <VStack gap={3} align="center">
          <AddressIcon address={display.address} boxSize={12} rounded="full" />
          <VStack gap={1} align="center">
            <Heading size="md">{displayName}</Heading>
            <HStack gap={2}>
              {display.position > 0 && (
                <Badge variant="neutral" size="sm" rounded="sm">
                  {"#"}
                  {display.position}
                </Badge>
              )}
              <Text textStyle="sm" color="text.subtle">
                <Trans i18nKey="{{value}} actions" values={{ value: display.score }} />
              </Text>
            </HStack>
          </VStack>
          <Button asChild variant="outline" size="xs" rounded="full">
            <NextLink href={`/profile/${display.address}`}>{t("View full profile")}</NextLink>
          </Button>
        </VStack>

        <Heading size="sm" fontWeight="semibold">
          {t("Actions in this quest")}
        </Heading>

        {isLoading ? (
          Array.from({ length: SKELETON_COUNT }, (_, i) => <Skeleton key={i} borderRadius="xl" h="56px" />)
        ) : actions.length > 0 ? (
          actions.map(action => (
            <BetterActionCard
              key={`action-${action.appId}-${action.blockTimestamp}`}
              amountB3tr={action.amount}
              appId={action.appId}
              blockNumber={action.blockNumber}
              blockTimestamp={action.blockTimestamp}
              proof={action.proof}
            />
          ))
        ) : (
          <Text textStyle="sm" color="text.subtle" textAlign="center" py={4}>
            {t("No actions yet for this quest")}
          </Text>
        )}

        {hasNextPage && (
          <Button variant="outline" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage} mx="auto">
            {t("Load more")}
          </Button>
        )}
      </VStack>
    </BaseModal>
  )
}
