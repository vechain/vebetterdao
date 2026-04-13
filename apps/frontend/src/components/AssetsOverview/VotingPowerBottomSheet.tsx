"use client"

import {
  Box,
  Button,
  HStack,
  Icon,
  Stack,
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
import { Flash, NavArrowRight, InfoCircle, HeartSolid, ArrowDown } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { Transaction } from "@/api/indexer/transactions/useTransactions"
import { ActivityItemProps, ActivityList } from "@/components/AssetsOverview/ActivityList"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { PowerUpModal, PowerDownModal } from "@/components/PowerUpModal"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

type Props = {
  isOpen: boolean
  onClose: () => void
  formatted: string
  votingPowerNextRound: bigint
  isLoading: boolean
}

// TODO: Add "B3TR_PROPOSAL_WITHDRAW" once indexer PR #1232 is merged and released
// https://github.com/vechain/vechain-indexer/pull/1232
const VOTING_POWER_EVENT_NAMES = ["B3TR_SWAP_B3TR_TO_VOT3", "B3TR_SWAP_VOT3_TO_B3TR", "B3TR_PROPOSAL_SUPPORT"] as const
const compactFormatter = getCompactFormatter(2)

const getVotingPowerActivityProps = (tx: Transaction): ActivityItemProps | null => {
  switch (tx.eventName) {
    case "B3TR_SWAP_B3TR_TO_VOT3":
      return {
        label: "Power up",
        icon: <Flash />,
        iconBg: "status.positive.subtle",
        iconColor: "status.positive.strong",
        amount: tx.outputValue ? compactFormatter.format(Number(formatEther(BigInt(tx.outputValue)))) : "0",
        token: "VOT3",
        sign: "+",
        amountColor: "status.positive.strong",
      }
    case "B3TR_SWAP_VOT3_TO_B3TR":
      return {
        label: "Power down",
        icon: <ArrowDown />,
        iconBg: "status.negative.subtle",
        iconColor: "status.negative.strong",
        amount: tx.outputValue ? compactFormatter.format(Number(formatEther(BigInt(tx.outputValue)))) : "0",
        token: "B3TR",
        sign: "+",
        amountColor: undefined,
      }
    case "B3TR_PROPOSAL_SUPPORT":
      return {
        label: "Supported proposal",
        icon: <HeartSolid />,
        iconBg: "status.info.subtle",
        iconColor: "status.info.strong",
        amount: tx.value ? compactFormatter.format(Number(formatEther(BigInt(tx.value)))) : "0",
        token: "VOT3",
        sign: "-",
        amountColor: undefined,
      }
    default:
      return null
  }
}

const CompositionLine = ({ label, value }: { label: string; value: string }) => (
  <HStack justify="space-between" py="1" w="full">
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
    <VStack gap="4" align="stretch" w="full">
      {/* Summary */}

      <VStack gap="4" align="start" justify="space-between" w="full" p="4" rounded="lg" bg="status.positive.subtle">
        <HStack justify="space-between" align="start">
          <Box>
            <Text textStyle="xs" color="text.subtle" mb="1">
              {t("Current Voting Power")}
            </Text>
            <Skeleton loading={isLoading}>
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
            </Skeleton>
          </Box>
        </HStack>

        {/* Composition breakdown */}
        <Skeleton loading={isLoading} rounded="lg" w="full">
          <VStack
            align="start"
            justify="space-between"
            gap="0"
            borderTopWidth="1px"
            borderColor="border.secondary"
            w="full">
            <CompositionLine label={t("VOT3 balance")} value={`${vot3BalanceOnly} VOT3`} />
            {depositsFormatted && (
              <CompositionLine label={t("From proposal support")} value={`${depositsFormatted} VOT3`} />
            )}
          </VStack>
        </Skeleton>

        {account?.address && (
          <Stack mt="3" gap="3" direction={"column"} w="full">
            <Button
              variant="primary"
              rounded="full"
              onClick={() => {
                onClose()
                onOpenPowerUp()
              }}>
              <Icon as={Flash} boxSize="4" />
              {t("Power up")}
            </Button>
            <Button
              variant="tertiary"
              rounded="full"
              onClick={() => {
                onClose()
                onOpenPowerDown()
              }}>
              {t("Power down")}
            </Button>
          </Stack>
        )}
      </VStack>

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

      <ActivityList eventNames={[...VOTING_POWER_EVENT_NAMES]} getActivityProps={getVotingPowerActivityProps} />
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
