import { Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useGetFeeLockPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetFeeLockPeriod"
import { useGetFeePercentage } from "@/api/contracts/navigatorRegistry/hooks/useGetFeePercentage"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const InfoRow = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <HStack
    justify="space-between"
    align="start"
    py={3}
    borderBottomWidth="1px"
    borderColor="border.secondary"
    _last={{ borderBottomWidth: 0 }}>
    <VStack align="start" gap={0} flex={1}>
      <Text textStyle="sm" fontWeight="semibold">
        {label}
      </Text>
      {hint && (
        <Text textStyle="xs" color="text.subtle">
          {hint}
        </Text>
      )}
    </VStack>
    <Text textStyle="sm" fontWeight="bold" flexShrink={0}>
      {value}
    </Text>
  </HStack>
)

export const NavigatorRewardsInfoModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data: feePercentage } = useGetFeePercentage()
  const { data: feeLockPeriod } = useGetFeeLockPeriod()

  return (
    <BaseModal showCloseButton isCloseable ariaTitle={t("How Rewards Work")} isOpen={isOpen} onClose={onClose}>
      <VStack w="full" align="stretch" gap={4}>
        <Heading size="md">{t("How Rewards Work")}</Heading>

        <Text textStyle="sm" color="text.subtle">
          {t("rewardsInfoDescription")}
        </Text>

        <VStack align="stretch" gap={0} p={3} borderRadius="lg" bg="bg.subtle">
          <InfoRow
            label={t("Fee Rate")}
            value={feePercentage ? `${feePercentage.percent}%` : "—"}
            hint={t("rewardsInfoFeeRateHint")}
          />
          <InfoRow label={t("Relayer Fee")} value={t("Up to 100 B3TR")} hint={t("rewardsInfoRelayerFeeHint")} />
          <InfoRow
            label={t("Lock Period")}
            value={feeLockPeriod ? t("{{count}} rounds", { count: feeLockPeriod }) : "—"}
            hint={t("rewardsInfoLockPeriodHint")}
          />
        </VStack>

        <VStack align="stretch" gap={2.5} p={3} borderRadius="lg" bg="status.info.subtle">
          {(["rewardsInfoBullet1", "rewardsInfoBullet2", "rewardsInfoBullet3"] as const).map(key => (
            <HStack key={key} gap={2} align="flex-start">
              <Text textStyle="xs" color="text.subtle" flexShrink={0} mt={0.5} aria-hidden>
                {"•"}
              </Text>
              <Text textStyle="xs" color="text.subtle" lineHeight="short">
                {t(key)}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </BaseModal>
  )
}
