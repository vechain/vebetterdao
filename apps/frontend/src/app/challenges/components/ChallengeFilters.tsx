import { Badge, Button, Flex, Menu, Portal, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuFilter } from "react-icons/lu"

import { ChallengeKind, ChallengeStatus } from "@/api/challenges/types"

export type TypeFilter = ChallengeKind | "all"
export type StatusFilter = ChallengeStatus | "all"

const TYPE_OPTIONS = [
  { value: "all" as const, labelKey: "All" as const },
  { value: ChallengeKind.Stake, labelKey: "Stake" as const },
  { value: ChallengeKind.Sponsored, labelKey: "Sponsored" as const },
]

const STATUS_OPTIONS = [
  { value: "all" as const, labelKey: "All" as const },
  { value: ChallengeStatus.Pending, labelKey: "Pending" as const },
  { value: ChallengeStatus.Active, labelKey: "Active" as const },
  { value: ChallengeStatus.Finalized, labelKey: "Finalized" as const },
  { value: ChallengeStatus.Cancelled, labelKey: "Cancelled" as const },
]

interface ChallengeFiltersProps {
  type: TypeFilter
  status: StatusFilter
  onTypeChange: (v: TypeFilter) => void
  onStatusChange: (v: StatusFilter) => void
}

export const ChallengeFilters = ({ type, status, onTypeChange, onStatusChange }: ChallengeFiltersProps) => {
  const { t } = useTranslation()
  const activeCount = (type !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0)

  return (
    <Menu.Root closeOnSelect={false} positioning={{ placement: "bottom-end" }} lazyMount>
      <Menu.Trigger asChild>
        <Button variant="outline" size="sm" rounded="full" pos="relative">
          <LuFilter />
          {t("Filters")}
          {activeCount > 0 && (
            <Badge
              pos="absolute"
              top="-6px"
              right="-6px"
              borderRadius="full"
              size="xs"
              variant="solid"
              colorPalette="blue">
              {activeCount}
            </Badge>
          )}
        </Button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="200px" shadow="lg" borderRadius="2xl" p={3}>
            <Text fontWeight="bold" mb={2}>
              {t("Type")}
            </Text>
            <Flex flexWrap="wrap" gap={2} mb={4}>
              {TYPE_OPTIONS.map(opt => (
                <Button
                  key={String(opt.value)}
                  rounded="full"
                  variant={type === opt.value ? "solid" : "subtle"}
                  size="xs"
                  onClick={() => onTypeChange(opt.value)}>
                  {t(opt.labelKey)}
                </Button>
              ))}
            </Flex>

            <Menu.Separator />

            <Text fontWeight="bold" mb={2} mt={2}>
              {t("Status")}
            </Text>
            <VStack align="stretch" gap={1}>
              {STATUS_OPTIONS.map(opt => (
                <Button
                  key={String(opt.value)}
                  rounded="full"
                  variant={status === opt.value ? "solid" : "subtle"}
                  size="xs"
                  justifyContent="flex-start"
                  onClick={() => onStatusChange(opt.value)}>
                  {t(opt.labelKey)}
                </Button>
              ))}
            </VStack>

            {activeCount > 0 && (
              <>
                <Menu.Separator />
                <Button
                  variant="ghost"
                  size="xs"
                  w="full"
                  mt={2}
                  onClick={() => {
                    onTypeChange("all")
                    onStatusChange("all")
                  }}>
                  {t("Clear filters")}
                </Button>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
