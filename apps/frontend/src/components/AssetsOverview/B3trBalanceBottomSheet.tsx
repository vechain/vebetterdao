"use client"

import { Box, HStack, Icon, Text, VStack, useMediaQuery, Dialog, Portal, CloseButton } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { NavArrowRight, RefreshDouble, InfoCircle } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { TbContract, TbLeaf } from "react-icons/tb"

import { useB3trConverted } from "@/api/contracts/b3tr/hooks/useB3trConverted"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { PowerDownModal } from "@/components/PowerUpModal"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

type Props = {
  isOpen: boolean
  onClose: () => void
}

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

      <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
        {t("How to get more B3TR")}
      </Text>

      <VStack gap="2" align="stretch">
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
