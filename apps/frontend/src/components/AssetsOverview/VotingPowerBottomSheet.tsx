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
import { LuUsers } from "react-icons/lu"
import { formatEther } from "viem"

import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useGetStake } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { useIsNavigator } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { Transaction } from "@/api/indexer/transactions/useTransactions"
import { DelegationModal } from "@/app/navigators/shared/DelegationModal"
import { ActivityItemProps, ActivityList } from "@/components/AssetsOverview/ActivityList"
import { NavigatorDelegationCard } from "@/components/AssetsOverview/NavigatorDelegationCard"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { PowerUpModal, PowerDownModal } from "@/components/PowerUpModal"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"

type Props = {
  isOpen: boolean
  onClose: () => void
  formatted: string
  votingPowerNextRound: bigint
  isLoading: boolean
  isDelegated?: boolean
}

const VOTING_POWER_EVENT_NAMES = [
  "B3TR_SWAP_B3TR_TO_VOT3",
  "B3TR_SWAP_VOT3_TO_B3TR",
  "B3TR_PROPOSAL_SUPPORT",
  "B3TR_PROPOSAL_WITHDRAW",
  "B3TR_NAVIGATOR_DELEGATION_CREATED",
  "B3TR_NAVIGATOR_DELEGATION_INCREASED",
  "B3TR_NAVIGATOR_DELEGATION_DECREASED",
  "B3TR_NAVIGATOR_DELEGATION_REMOVED",
] as const
const compactFormatter = getCompactFormatter(2)

const getVotingPowerActivityProps = (tx: Transaction, account: string): ActivityItemProps | null => {
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
    case "B3TR_PROPOSAL_WITHDRAW":
      return {
        label: "Withdrew support",
        icon: <ArrowDown />,
        iconBg: "status.info.subtle",
        iconColor: "status.info.strong",
        amount: tx.value ? compactFormatter.format(Number(formatEther(BigInt(tx.value)))) : "0",
        token: "VOT3",
        sign: "+",
        amountColor: "status.positive.strong",
      }
    case "B3TR_NAVIGATOR_DELEGATION_CREATED":
    case "B3TR_NAVIGATOR_DELEGATION_INCREASED":
    case "B3TR_NAVIGATOR_DELEGATION_DECREASED":
    case "B3TR_NAVIGATOR_DELEGATION_REMOVED": {
      const isCitizen = tx.from?.toLowerCase() === account.toLowerCase()
      if (!isCitizen) return null

      const isDelegating =
        tx.eventName === "B3TR_NAVIGATOR_DELEGATION_CREATED" || tx.eventName === "B3TR_NAVIGATOR_DELEGATION_INCREASED"

      return {
        label: isDelegating
          ? tx.eventName === "B3TR_NAVIGATOR_DELEGATION_CREATED"
            ? "Delegated to Navigator"
            : "Increased delegation"
          : tx.eventName === "B3TR_NAVIGATOR_DELEGATION_DECREASED"
            ? "Decreased delegation"
            : "Removed Delegation",
        icon: <Icon as={LuUsers} />,
        iconBg: isDelegating ? "status.positive.subtle" : "status.negative.subtle",
        iconColor: isDelegating ? "status.positive.strong" : "status.negative.strong",
        amount: tx.value ? compactFormatter.format(Number(formatEther(BigInt(tx.value)))) : "0",
        token: "VOT3",
        sign: isDelegating ? "-" : "+",
        amountColor: isDelegating ? undefined : "status.positive.strong",
      }
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
  isDelegated,
  onOpenPowerUp,
  onOpenPowerDown,
  onOpenDelegation,
}: Omit<Props, "isOpen"> & {
  onOpenPowerUp: () => void
  onOpenPowerDown: () => void
  onOpenDelegation: () => void
}) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  // Current composition: wallet VOT3 balance + deposit voting power at current block
  const { data: currentVot3Balance } = useGetVot3UnlockedBalance(account?.address)
  const { data: bestBlock } = useBestBlockCompressed()
  // bestBlock - 1: getPastVotes requires timepoint < block.number
  const { data: currentVotes } = useTotalVotesOnBlock(
    bestBlock?.number ? Number(bestBlock.number) - 1 : undefined,
    account?.address,
  )
  const { data: currentDelegated } = useGetDelegatedAmount(isDelegated ? account?.address : undefined)
  const { data: isNavigator } = useIsNavigator(account?.address)
  const { data: navigatorStake } = useGetStake(isNavigator ? (account?.address ?? "") : "")

  const stakedFormatted = useMemo(() => {
    if (!isNavigator || !navigatorStake?.raw || navigatorStake.raw === 0n) return null
    return FormattingUtils.humanNumber(navigatorStake.scaled)
  }, [isNavigator, navigatorStake])

  const vot3BalanceOnly = useMemo(() => {
    if (!currentVot3Balance) return "0"
    return currentVot3Balance.formatted
  }, [currentVot3Balance])

  const vot3BalanceScaled = currentVot3Balance?.scaled ?? "0"

  const delegatedFormatted = useMemo(() => {
    if (!currentDelegated?.raw || currentDelegated.raw === 0n) return null
    return FormattingUtils.humanNumber(currentDelegated.scaled)
  }, [currentDelegated])

  const depositsFormatted = useMemo(() => {
    if (!currentVotes?.depositsVotesWei || currentVotes.depositsVotesWei === 0n) return null
    return FormattingUtils.humanNumber(currentVotes.depositsVotes)
  }, [currentVotes])

  return (
    <VStack gap="4" align="stretch" w="full">
      <NavigatorDelegationCard accountAddress={account?.address} onClose={onClose} />

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
                    parent="span"
                    i18nKey="<bold>{{sign}}{{votingPowerNextRound}}</bold> in next round"
                    values={{
                      sign: votingPowerNextRound > 0n ? "+" : "",
                      votingPowerNextRound: getCompactFormatter(2).format(Number(formatEther(votingPowerNextRound))),
                    }}
                    components={{
                      bold: (
                        <Text
                          key="bold"
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
        <VStack
          align="start"
          justify="space-between"
          gap="0"
          borderTopWidth="1px"
          borderColor="border.secondary"
          w="full">
          {isDelegated && delegatedFormatted && (
            <CompositionLine label={t("Delegated")} value={`${delegatedFormatted} VOT3`} />
          )}
          <CompositionLine label={t("Balance")} value={`${vot3BalanceOnly} VOT3`} />
          {depositsFormatted && (
            <CompositionLine label={t("Deposited for proposal support")} value={`${depositsFormatted} VOT3`} />
          )}
          {stakedFormatted && <CompositionLine label={t("From staking")} value={`${stakedFormatted} VOT3`} />}
        </VStack>

        {isDelegated && Number(vot3BalanceScaled) > 0 && (
          <HStack
            gap="2"
            justify="space-between"
            p="2"
            w="full"
            rounded="md"
            bg="status.warning.subtle"
            cursor="pointer"
            _hover={{ opacity: 0.85 }}
            onClick={() => {
              onClose()
              onOpenDelegation()
            }}>
            <HStack>
              <Icon boxSize="4" color="status.warning.strong">
                <InfoCircle />
              </Icon>
              <Text textStyle="xs" color="status.warning.strong" fontWeight="semibold">
                {t("You have {{amount}} undelegated VOT3 — delegate to increase voting power", {
                  amount: FormattingUtils.humanNumber(vot3BalanceScaled),
                })}
              </Text>
            </HStack>
            <Icon boxSize="4" color="status.warning.strong">
              <NavArrowRight />
            </Icon>
          </HStack>
        )}

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

      <ActivityList eventNames={[...VOTING_POWER_EVENT_NAMES]} getActivityProps={getVotingPowerActivityProps} />

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

        {isDelegated && (
          <InfoRow
            icon={<Icon as={LuUsers} />}
            title={t("Delegation & voting power")}
            description={t(
              "Only VOT3 delegated to your navigator counts as voting power. Undelegated VOT3 won't be counted.",
            )}
          />
        )}
      </VStack>
    </VStack>
  )
}

export const VotingPowerBottomSheet = (props: Props) => {
  const { isOpen, onClose } = props
  const { t } = useTranslation()
  const { account } = useWallet()
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])
  const [isPowerUpOpen, setIsPowerUpOpen] = useState(false)
  const [isPowerDownOpen, setIsPowerDownOpen] = useState(false)
  const [isDelegationOpen, setIsDelegationOpen] = useState(false)
  const closePowerUp = useCallback(() => setIsPowerUpOpen(false), [])
  const closePowerDown = useCallback(() => setIsPowerDownOpen(false), [])
  const openPowerUp = useCallback(() => setIsPowerUpOpen(true), [])
  const openPowerDown = useCallback(() => setIsPowerDownOpen(true), [])
  const closeDelegation = useCallback(() => setIsDelegationOpen(false), [])
  const openDelegation = useCallback(() => setIsDelegationOpen(true), [])

  const { data: navigatorAddress = "" } = useGetNavigator(account?.address)
  const { data: navigatorData } = useNavigatorByAddress(navigatorAddress ?? "")

  const content = (
    <VotingPowerContent
      {...props}
      onOpenPowerUp={openPowerUp}
      onOpenPowerDown={openPowerDown}
      onOpenDelegation={openDelegation}
    />
  )

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
        {navigatorData && (
          <DelegationModal isOpen={isDelegationOpen} onClose={closeDelegation} navigator={navigatorData} />
        )}
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
      {navigatorData && (
        <DelegationModal isOpen={isDelegationOpen} onClose={closeDelegation} navigator={navigatorData} />
      )}
    </>
  )
}
