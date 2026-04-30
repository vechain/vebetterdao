import { Button, Heading, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { WarningTriangle } from "iconoir-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCalendar, LuClock } from "react-icons/lu"

import { useGetExitNoticePeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetExitNoticePeriod"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { BaseModal } from "@/components/BaseModal"
import { useAnnounceExit } from "@/hooks/navigator/useAnnounceExit"
import { useEstimateFutureRoundTimestamp } from "@/hooks/useEstimateFutureRoundTimestamp"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const AnnounceExitModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { sendTransaction } = useAnnounceExit({ onSuccess: onClose })
  const { data: noticePeriod, isLoading: noticeLoading } = useGetExitNoticePeriod()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const noticePeriodNum = noticePeriod ? Number(noticePeriod) : 0

  const exitRoundId = useMemo(() => {
    if (!currentRoundId || !noticePeriodNum) return undefined
    return (Number(currentRoundId) + noticePeriodNum).toString()
  }, [currentRoundId, noticePeriodNum])

  const estimatedExitTimestamp = useEstimateFutureRoundTimestamp({
    currentRoundId: currentRoundId ?? undefined,
    targetRoundId: exitRoundId,
  })

  const estimatedDate = estimatedExitTimestamp
    ? new Date(estimatedExitTimestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} align="stretch" w="full">
        <VStack gap={2} align="center">
          <Icon as={WarningTriangle} boxSize={10} color="status.warning.primary" />
          <Heading size="xl" fontWeight="bold" textAlign="center">
            {t("Announce Exit")}
          </Heading>
        </VStack>

        <VStack gap={3} align="stretch">
          <Text textStyle="sm" color="fg.muted" textAlign="center">
            {t("You are about to announce your exit as a navigator. This action cannot be undone.")}
          </Text>

          {/* Notice period & estimated date */}
          <HStack
            gap={4}
            w="full"
            bg="card.default"
            border="1px solid"
            borderColor="border.secondary"
            borderRadius="xl"
            p={4}
            justify="space-between">
            <VStack align="start" gap={1} flex={1}>
              <HStack gap={1.5}>
                <Icon as={LuClock} boxSize={4} color="fg.muted" />
                <Text textStyle="xs" color="fg.muted">
                  {t("Notice period")}
                </Text>
              </HStack>
              <Skeleton loading={noticeLoading}>
                <Text textStyle="md" fontWeight="bold">
                  {t("{{count}} round", { count: noticePeriodNum })}
                </Text>
              </Skeleton>
            </VStack>

            <VStack align="end" gap={1} flex={1}>
              <HStack gap={1.5}>
                <Icon as={LuCalendar} boxSize={4} color="fg.muted" />
                <Text textStyle="xs" color="fg.muted">
                  {t("Estimated completion")}
                </Text>
              </HStack>
              <Skeleton loading={!estimatedDate}>
                <Text textStyle="md" fontWeight="bold">
                  {estimatedDate ?? "—"}
                </Text>
              </Skeleton>
            </VStack>
          </HStack>

          <VStack
            gap={2}
            align="start"
            bg="status.warning.subtle"
            border="1px solid"
            borderColor="status.warning.strong"
            borderRadius="xl"
            p={4}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("What happens next:")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {"• "}
              {t("You must continue voting during the notice period")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {"• "}
              {t("After the notice period, all citizen delegations become void")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {"• "}
              {t("You will be able to withdraw your stake")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {"• "}
              {t("You cannot reactivate — a new registration is required")}
            </Text>
          </VStack>
        </VStack>

        <VStack gap={2} mt={2} w="full">
          <Button variant="negative" w="full" rounded="full" size="lg" onClick={() => sendTransaction({})}>
            {t("Confirm Exit")}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
