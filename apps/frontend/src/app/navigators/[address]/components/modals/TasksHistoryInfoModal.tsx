import { Badge, Heading, HStack, Tabs, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
}

type TagPalette = "green" | "orange" | "red" | "blue" | "gray" | "purple"

const LegendRow = ({ palette, label, hint }: { palette: TagPalette; label: string; hint: string }) => (
  <HStack
    gap={3}
    align="flex-start"
    py={2}
    borderBottomWidth="1px"
    borderColor="border.secondary"
    _last={{ borderBottomWidth: 0 }}>
    <Badge colorPalette={palette} size="sm" flexShrink={0}>
      {label}
    </Badge>
    <Text textStyle="xs" color="text.subtle" lineHeight="short">
      {hint}
    </Text>
  </HStack>
)

const LegendRowNeutral = ({
  label,
  hint,
  showDivider = true,
}: {
  label: string
  hint: string
  showDivider?: boolean
}) => (
  <HStack gap={3} align="flex-start" py={2} borderBottomWidth={showDivider ? "1px" : 0} borderColor="border.secondary">
    <Badge variant="neutral" size="sm" flexShrink={0}>
      {label}
    </Badge>
    <Text textStyle="xs" color="text.subtle" lineHeight="short">
      {hint}
    </Text>
  </HStack>
)

const SLASH_BULLET_KEYS = ["tasksHistoryInfoSlash1", "tasksHistoryInfoSlash2", "tasksHistoryInfoSlash3"] as const

export const TasksHistoryInfoModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { data: reportInterval } = useGetReportInterval()

  return (
    <BaseModal showCloseButton isCloseable ariaTitle={t("tasksHistoryInfoTitle")} isOpen={isOpen} onClose={onClose}>
      <VStack w="full" align="stretch" gap={4}>
        <Heading size="md">{t("tasksHistoryInfoTitle")}</Heading>
        <Text textStyle="xs" color="text.subtle">
          {t("tasksHistoryInfoIntro")}
        </Text>

        <Tabs.Root variant="line" colorPalette="actions.primary" w="full" defaultValue="task-tags" lazyMount>
          <Tabs.List
            w="full"
            flexWrap="wrap"
            gapX={1}
            gapY={1}
            borderBottomWidth="1px"
            borderBottomStyle="solid"
            borderColor="border.primary"
            pb={2}>
            <Tabs.Trigger value="task-tags" textStyle="xs" fontWeight="semibold" py={2} px={2}>
              {t("tasksHistoryInfoTabTasks")}
            </Tabs.Trigger>
            <Tabs.Trigger value="round-badges" textStyle="xs" fontWeight="semibold" py={2} px={2}>
              {t("tasksHistoryInfoTabRounds")}
            </Tabs.Trigger>
            <Tabs.Trigger value="slashing" textStyle="xs" fontWeight="semibold" py={2} px={2}>
              {t("tasksHistoryInfoSectionSlashing")}
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="task-tags" pt={3}>
            <VStack gap={0} align="stretch">
              <LegendRow palette="green" label={t("On Time")} hint={t("tasksHistoryInfoOnTimeDesc")} />
              <LegendRow palette="orange" label={t("Overdue")} hint={t("tasksHistoryInfoOverdueDesc")} />
              <LegendRow palette="red" label={t("Missed")} hint={t("tasksHistoryInfoMissedDesc")} />
              <LegendRow palette="blue" label={t("Pending")} hint={t("tasksHistoryInfoPendingDesc")} />
              <LegendRow palette="gray" label={t("Not due")} hint={t("tasksHistoryInfoNotDueDesc")} />
              <LegendRowNeutral
                label={t("Report")}
                hint={t("tasksHistoryInfoPeriodicReportDesc", { interval: reportInterval ?? 2 })}
              />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="round-badges" pt={3}>
            <VStack gap={0} align="stretch">
              <LegendRow palette="blue" label={t("Round in progress")} hint={t("tasksHistoryInfoRoundProgressDesc")} />
              <LegendRow
                palette="red"
                label={t("tasksHistoryInfoRoundIssuesTitle")}
                hint={t("tasksHistoryInfoRoundIssuesDesc")}
              />
              <LegendRow palette="green" label={t("All good")} hint={t("tasksHistoryInfoAllGoodDesc")} />
              <LegendRow palette="purple" label={t("Slashed")} hint={t("tasksHistoryInfoSlashedBadgeDesc")} />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="slashing" pt={3}>
            <VStack align="stretch" gap={2.5} p={3} borderRadius="lg" bg="status.warning.subtle">
              {SLASH_BULLET_KEYS.map(key => (
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
          </Tabs.Content>
        </Tabs.Root>

        <VStack align="stretch" pt={3} mt={1} borderTopWidth="1px" borderColor="border.secondary" w="full">
          <LegendRowNeutral
            showDivider={false}
            label={t("Report Navigator")}
            hint={t("tasksHistoryInfoReportNavigatorDesc")}
          />
        </VStack>
      </VStack>
    </BaseModal>
  )
}
