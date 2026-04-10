"use client"

import { Box, HStack, Icon, Text, VStack, useMediaQuery, Dialog, Portal, CloseButton } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { Gift, NavArrowRight, RefreshDouble, InfoCircle, ArrowDown, ArrowUp, StarSolid } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbContract, TbLeaf } from "react-icons/tb"
import { formatEther } from "viem"

import { useB3trConverted } from "@/api/contracts/b3tr/hooks/useB3trConverted"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { Transaction } from "@/api/indexer/transactions/useTransactions"
import { ActivityItemProps, ActivityList } from "@/components/AssetsOverview/ActivityList"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { PowerDownModal } from "@/components/PowerUpModal"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const BALANCE_EVENT_NAMES = [
  "B3TR_CLAIM_REWARD",
  "B3TR_ACTION",
  "B3TR_UPGRADE_GM",
  "B3TR_SWAP_B3TR_TO_VOT3",
  "B3TR_SWAP_VOT3_TO_B3TR",
  "TRANSFER_FT",
] as const
const compactFormatter = getCompactFormatter(2)
const fmtValue = (raw?: string) => (raw ? compactFormatter.format(Number(formatEther(BigInt(raw)))) : "0")

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

const BalanceContent = ({ onClose, onOpenPowerDown }: { onClose: () => void; onOpenPowerDown: () => void }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { data: convertibleVot3 } = useB3trConverted(account?.address)
  const { data: apps } = useXApps()

  const getBalanceActivityProps = useCallback(
    (tx: Transaction, account: string): ActivityItemProps | null => {
      switch (tx.eventName) {
        case "B3TR_CLAIM_REWARD":
          return {
            label: tx.roundId ? t("Claimed reward for round {{round}}", { round: tx.roundId }) : t("Claimed rewards"),
            icon: <Gift />,
            iconBg: "status.positive.subtle",
            iconColor: "status.positive.strong",
            amount: fmtValue(tx.value),
            token: "B3TR",
            sign: "+",
            amountColor: "status.positive.strong",
          }
        case "B3TR_ACTION": {
          const appName = apps?.allApps.find(a => a.id === tx.appId)?.name ?? ""
          return {
            label: `${t("Better action on")} ${appName}`,
            icon: <TbLeaf />,
            iconBg: "status.positive.subtle",
            iconColor: "status.positive.strong",
            amount: fmtValue(tx.value),
            token: "B3TR",
            sign: "+",
            amountColor: "status.positive.strong",
          }
        }
        case "B3TR_UPGRADE_GM":
          return {
            label: t("GM upgrade"),
            icon: <StarSolid />,
            iconBg: "status.warning.subtle",
            iconColor: "status.warning.strong",
            amount: fmtValue(tx.value),
            token: "B3TR",
            sign: "-",
            amountColor: undefined,
          }
        case "B3TR_SWAP_B3TR_TO_VOT3":
          return {
            label: t("Powered up"),
            icon: <ArrowUp />,
            iconBg: "status.info.subtle",
            iconColor: "status.info.strong",
            amount: fmtValue(tx.inputValue),
            token: "B3TR",
            sign: "-",
            amountColor: undefined,
          }
        case "B3TR_SWAP_VOT3_TO_B3TR":
          return {
            label: t("Converted from VOT3"),
            icon: <ArrowDown />,
            iconBg: "status.positive.subtle",
            iconColor: "status.positive.strong",
            amount: fmtValue(tx.outputValue),
            token: "B3TR",
            sign: "+",
            amountColor: "status.positive.strong",
          }
        case "TRANSFER_FT": {
          const b3trAddress = getConfig().b3trContractAddress?.toLowerCase()
          if (tx.tokenAddress?.toLowerCase() !== b3trAddress) return null
          const isOutgoing = tx.from?.toLowerCase() === account.toLowerCase()
          return {
            label: isOutgoing ? t("Outgoing transfer") : t("Incoming transfer"),
            icon: isOutgoing ? <ArrowUp /> : <ArrowDown />,
            iconBg: isOutgoing ? "status.negative.subtle" : "status.positive.subtle",
            iconColor: isOutgoing ? "status.negative.strong" : "status.positive.strong",
            amount: fmtValue(tx.value),
            token: "B3TR",
            sign: isOutgoing ? "-" : "+",
            amountColor: isOutgoing ? undefined : "status.positive.strong",
          }
        }
        default:
          return null
      }
    },
    [t, apps],
  )

  return (
    <VStack gap="4" align="stretch">
      <Box p="4" rounded="lg" bg="status.info.subtle" textAlign="center">
        <Text textStyle="xs" color="text.subtle">
          {t("Available balance")}
        </Text>
        <Text textStyle="2xl" fontWeight="bold">
          {b3trBalance?.formatted ?? "0"}
          {" B3TR"}
        </Text>
      </Box>

      <ActivityList eventNames={[...BALANCE_EVENT_NAMES]} getActivityProps={getBalanceActivityProps} />

      <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
        {t("How to get more B3TR")}
      </Text>

      <VStack gap="2" align="stretch">
        {convertibleVot3 && Number(convertibleVot3.scaled) > 0 && (
          <InfoRow
            icon={<RefreshDouble />}
            title={t("Convert VOT3 to B3TR")}
            description={t("You have {{amount}} VOT3 that can be converted back to B3TR.", {
              amount: convertibleVot3.formatted,
            })}
            onClick={() => {
              onClose()
              onOpenPowerDown()
            }}
          />
        )}

        <InfoRow
          icon={<TbLeaf />}
          title={t("Use sustainable apps")}
          description={t("Complete actions in VeBetterDAO apps to earn B3TR rewards.")}
          onClick={() => {
            onClose()
            router.push("/apps")
          }}
        />

        <InfoRow
          icon={<TbContract />}
          title={t("Vote in allocation rounds")}
          description={t("Vote for your favorite apps each round to earn voting rewards in B3TR.")}
          onClick={() => {
            onClose()
            router.push("/allocations")
          }}
        />

        <InfoRow
          icon={<InfoCircle />}
          title={t("What is B3TR?")}
          description={t(
            "B3TR is the VeBetterDAO ecosystem token. Earn it by using apps and voting. Convert to VOT3 for voting power.",
          )}
        />
      </VStack>
    </VStack>
  )
}

export const B3trBalanceBottomSheet = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])
  const [isPowerDownOpen, setIsPowerDownOpen] = useState(false)
  const closePowerDown = useCallback(() => setIsPowerDownOpen(false), [])
  const openPowerDown = useCallback(() => setIsPowerDownOpen(true), [])

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
                    {t("Your B3TR balance")}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild position="static">
                    <CloseButton size="md" />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body py={4}>
                  <BalanceContent onClose={onClose} onOpenPowerDown={openPowerDown} />
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
        <PowerDownModal isOpen={isPowerDownOpen} onClose={closePowerDown} />
      </>
    )
  }

  return (
    <>
      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        ariaTitle={t("Your B3TR balance")}
        ariaDescription={t("Details about your B3TR balance")}
        title={t("Your B3TR balance")}>
        <BalanceContent onClose={onClose} onOpenPowerDown={openPowerDown} />
      </BaseBottomSheet>
      <PowerDownModal isOpen={isPowerDownOpen} onClose={closePowerDown} />
    </>
  )
}
