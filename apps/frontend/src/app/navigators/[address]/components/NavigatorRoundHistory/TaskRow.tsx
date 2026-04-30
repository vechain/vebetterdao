"use client"

import { HStack, Icon, Text } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { type ReportRowStatus } from "./types"
import { statusColor, statusIcon } from "./utils"

type TaskRowProps = {
  icon: React.ReactNode
  label: string
  status: ReportRowStatus
  onClick?: () => void
}

export const TaskRow = ({ icon, label, status, onClick }: TaskRowProps) => {
  const { t } = useTranslation()

  const showBadge = status !== "done"
  const badgeConfig = {
    missed: { palette: "red", label: t("Missed") },
    late: { palette: "orange", label: t("Overdue") },
    pending: { palette: "blue", label: t("Pending") },
    notDue: { palette: "gray", label: t("Not due") },
    optionalOpen: { palette: "gray", label: t("Optional") },
  }

  return (
    <HStack
      gap={3}
      py={2}
      borderRadius="md"
      cursor={onClick ? "pointer" : undefined}
      _hover={onClick ? { bg: "bg.subtle" } : undefined}
      onClick={onClick}>
      <Icon boxSize={4} color={statusColor(status)}>
        {statusIcon(status)}
      </Icon>
      <HStack gap={2} flex={1}>
        <Icon boxSize={4} color="text.subtle">
          {icon}
        </Icon>
        <Text textStyle="sm" fontWeight="medium">
          {label}
        </Text>
      </HStack>
      {showBadge && badgeConfig[status] && (
        <Text textStyle="xs" color={badgeConfig[status].palette}>
          {badgeConfig[status].label}
        </Text>
      )}
      {onClick && (
        <Text textStyle="xs" color="text.subtle" fontWeight="semibold" display="flex" alignItems="center" gap={1}>
          {t("View")}
          <UilArrowUpRight size={14} />
        </Text>
      )}
    </HStack>
  )
}
