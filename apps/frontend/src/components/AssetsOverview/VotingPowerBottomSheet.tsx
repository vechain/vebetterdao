"use client"

import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  VStack,
  Badge,
  Skeleton,
  useMediaQuery,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Flash, NavArrowRight, InfoCircle, HeartSolid } from "iconoir-react"
import NextLink from "next/link"
import { useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FiAlertCircle } from "react-icons/fi"
import { formatEther } from "viem"

import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useTransactions } from "@/api/indexer/transactions/useTransactions"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { PowerUpModal, PowerDownModal } from "@/components/PowerUpModal"
import { TransactionCard } from "@/components/TransactionCard/TransactionCard"
import { EmptyState } from "@/components/ui/empty-state"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

type Props = {
  isOpen: boolean
  onClose: () => void
  formatted: string
  votingPowerNextRound: bigint
  isLoading: boolean
}

const VOTING_POWER_EVENT_NAMES = ["B3TR_SWAP_B3TR_TO_VOT3", "B3TR_SWAP_VOT3_TO_B3TR", "B3TR_PROPOSAL_SUPPORT"] as const

const CompositionLine = ({ label, value }: { label: string; value: string }) => (
  <HStack justify="space-between" py="1">
    <Text textStyle="sm" color="text.subtle">
      {label}
    </Text>
    <Text textStyle="sm" fontWeight="semibold">
      {value}
    </Text>
  </HStack>
)

const InfoRow = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
}) => (
  <HStack
    gap="3"
    p="3"
    rounded="lg"
    bg="card.subtle"
    align="start"
    cursor={onClick ? "pointer" : undefined}
    onClick={onClick}
    _hover={onClick ? { opacity: 0.85 } : undefined}>
    <Icon boxSize="5" color="text.subtle" mt="0.5">
      {icon}
    </Icon>
    <VStack align="start" gap="0.5" flex={1}>
      <Text textStyle="sm" fontWeight="semibold">
        {title}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {description}
      </Text>
    </VStack>
    {onClick && (
      <Icon boxSize="4" color="text.subtle" mt="1">
        <NavArrowRight />
      </Icon>
    )}
  </HStack>
)

const VotingPowerContent = ({
  onClose,
  formatted,
  votingPowerNextRound,
  isLoading,
  onOpenPowerUp,
  onOpenPowerDown,
}: Omit<Props, "isOpen"> & { onOpenPowerUp: () => void; onOpenPowerDown: () => void }) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: txData, isLoading: isTxLoading } = useTransactions(account?.address ?? "", {
    eventName: [...VOTING_POWER_EVENT_NAMES],
    size: 5,
  })

  const transactions = useMemo(() => txData?.pages.flatMap(page => page.data) ?? [], [txData])
  const hasNextPage = useMemo(() => txData?.pages[0]?.pagination?.hasNext ?? false, [txData])

  // Current composition: wallet VOT3 balance + deposit voting power at current block
  const { data: currentVot3Balance } = useGetVot3Balance(account?.address)
  const { data: bestBlock } = useBestBlockCompressed()
  const { data: currentVotes } = useTotalVotesOnBlock(
    bestBlock?.number ? Number(bestBlock.number) : undefined,
    account?.address,
  )

  const vot3BalanceOnly = useMemo(() => {
    if (!currentVot3Balance) return "0"
    return currentVot3Balance.formatted
  }, [currentVot3Balance])

  const depositsFormatted = useMemo(() => {
    if (!currentVotes?.depositsVotesWei || currentVotes.depositsVotesWei === 0n) return null
    return FormattingUtils.humanNumber(currentVotes.depositsVotes)
  }, [currentVotes])

  return (
    <VStack gap="4" align="stretch">
      {/* Summary */}
      <Skeleton loading={isLoading} rounded="lg">
        <Box p="4" rounded="lg" bg="status.positive.subtle">
          <Text textStyle="xs" color="text.subtle" mb="1">
            {t("Your voting power")}
          </Text>
          <Text textStyle="2xl" fontWeight="bold">
            {formatted}
          </Text>
          {votingPowerNextRound !== 0n && (
            <Badge
              variant="neutral"
              bg="card.subtle"
              color="text.subtle"
              fontWeight="normal"
              size="sm"
              rounded="md"
              mt="2">
              <Trans
                i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> in next round"
                values={{
                  sign: votingPowerNextRound > 0n ? "+" : "",
                  votingPowerNextRound: getCompactFormatter(2).format(Number(formatEther(votingPowerNextRound))),
                }}
                components={{
                  bold: (
                    <Text
                      color={votingPowerNextRound > 0n ? "status.positive.strong" : "status.negative.strong"}
                      as="span"
                    />
                  ),
                }}
              />
            </Badge>
          )}

          {/* Composition breakdown */}
          <Box mt="3" pt="3" borderTopWidth="1px" borderColor="border.secondary">
            <CompositionLine label={t("VOT3 balance")} value={`${vot3BalanceOnly} VOT3`} />
            {depositsFormatted && (
              <CompositionLine label={t("From proposal support")} value={`${depositsFormatted} VOT3`} />
            )}
          </Box>
        </Box>
      </Skeleton>

      {/* Educational info */}
      <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
        {t("How it works")}
      </Text>

      <VStack gap="2" align="stretch">
        <InfoRow
          icon={<InfoCircle />}
          title={t("What is voting power?")}
          description={t(
            "Voting power determines your weight in allocation rounds and governance proposals. More power means more influence and higher rewards.",
          )}
        />

        <InfoRow
          icon={<Flash />}
          title={t("How to increase it")}
          description={t("Convert B3TR to VOT3 to increase your voting power. Earn B3TR by using sustainable apps.")}
          onClick={() => {
            onClose()
            onOpenPowerUp()
          }}
        />

        <InfoRow
          icon={<HeartSolid />}
          title={t("Proposal support")}
          description={t("VOT3 deposited to support proposals also counts toward your voting power.")}
        />
      </VStack>

      {/* Recent activity */}
      {account?.address && (
        <>
          <Text textStyle="sm" fontWeight="semibold" color="text.subtle" mt="1">
            {t("Recent activity")}
          </Text>

          <Skeleton loading={isTxLoading} rounded="lg">
            {transactions.length > 0 ? (
              <VStack gap="2" align="stretch">
                {transactions.map(transaction => (
                  <TransactionCard key={transaction.txId} transaction={transaction} />
                ))}
                {hasNextPage && (
                  <Button variant="link" asChild mx="auto">
                    <NextLink href={`/transactions/${account.address}`}>{t("See all")}</NextLink>
                  </Button>
                )}
              </VStack>
            ) : (
              <EmptyState bg="transparent" size="sm" title={t("No activity yet")} icon={<FiAlertCircle />} />
            )}
          </Skeleton>
        </>
      )}

      {/* CTAs */}
      {account?.address && (
        <VStack gap="2" mt="2" w="full">
          <Button
            variant="primary"
            w="full"
            rounded="full"
            size="lg"
            onClick={() => {
              onClose()
              onOpenPowerUp()
            }}>
            <Icon as={Flash} boxSize="4" />
            {t("Power up")}
          </Button>
          <Button
            variant="ghost"
            w="full"
            rounded="full"
            size="lg"
            onClick={() => {
              onClose()
              onOpenPowerDown()
            }}>
            {t("Reduce")}
          </Button>
        </VStack>
      )}
    </VStack>
  )
}

export const VotingPowerBottomSheet = (props: Props) => {
  const { isOpen, onClose } = props
  const { t } = useTranslation()
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])
  const [isPowerUpOpen, setIsPowerUpOpen] = useState(false)
  const [isPowerDownOpen, setIsPowerDownOpen] = useState(false)
  const closePowerUp = useCallback(() => setIsPowerUpOpen(false), [])
  const closePowerDown = useCallback(() => setIsPowerDownOpen(false), [])
  const openPowerUp = useCallback(() => setIsPowerUpOpen(true), [])
  const openPowerDown = useCallback(() => setIsPowerDownOpen(true), [])

  const content = <VotingPowerContent {...props} onOpenPowerUp={openPowerUp} onOpenPowerDown={openPowerDown} />

  if (isDesktop) {
    return (
      <>
        <Dialog.Root
          open={isOpen}
          onOpenChange={details => {
            if (!details.open) onClose()
          }}
          size="lg"
          scrollBehavior="inside"
          trapFocus={false}
          unmountOnExit>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content rounded="2xl" maxH="80vh" overflowY="auto">
                <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
                  <Dialog.Title fontWeight="bold" textStyle="xl">
                    {t("Your voting power")}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild position="static">
                    <CloseButton size="md" />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body py={4}>{content}</Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
        <PowerUpModal isOpen={isPowerUpOpen} onClose={closePowerUp} />
        <PowerDownModal isOpen={isPowerDownOpen} onClose={closePowerDown} />
      </>
    )
  }

  return (
    <>
      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        ariaTitle={t("Your voting power")}
        ariaDescription={t("Details about your voting power")}
        title={t("Your voting power")}>
        {content}
      </BaseBottomSheet>
      <PowerUpModal isOpen={isPowerUpOpen} onClose={closePowerUp} />
      <PowerDownModal isOpen={isPowerDownOpen} onClose={closePowerDown} />
    </>
  )
}
