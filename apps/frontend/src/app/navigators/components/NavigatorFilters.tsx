import { HStack, NativeSelect, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { NavigatorOrderBy } from "@/api/indexer/navigators/useNavigators"
import { SearchField } from "@/components/SearchField/SearchField"
import { NavigatorStatusFilter } from "@/hooks/navigator/useNavigatorFilterValues"

type Props = {
  searchTerm: string
  onSearchChange: (value: string) => void
  orderBy: NavigatorOrderBy
  onOrderByChange: (value: NavigatorOrderBy) => void
  statusFilter: NavigatorStatusFilter
  onStatusFilterChange: (value: NavigatorStatusFilter) => void
}

const selectFieldStyles = {
  borderRadius: "xl",
  bg: "bg.primary",
  border: "1px solid",
  borderColor: "border.primary",
  cursor: "pointer",
} as const

export const NavigatorFilters = ({
  searchTerm,
  onSearchChange,
  orderBy,
  onOrderByChange,
  statusFilter,
  onStatusFilterChange,
}: Props) => {
  const { t } = useTranslation()

  return (
    <Stack direction={{ base: "column", md: "row" }} w="full" gap={3}>
      <SearchField
        placeholder={t("Search by address or domain")}
        value={searchTerm}
        onChange={onSearchChange}
        inputWrapperProps={{ maxW: { base: "full", md: "320px" } }}
      />

      <HStack gap={2} flex={1} justify="flex-end">
        <NativeSelect.Root size="sm" w="auto">
          <NativeSelect.Field
            value={orderBy}
            onChange={e => onOrderByChange(e.target.value as NavigatorOrderBy)}
            {...selectFieldStyles}>
            <option value="registeredAt">{`${t("Sort by:")} ${t("Newest")}`}</option>
            <option value="stake">{`${t("Sort by:")} ${t("Most Staked")}`}</option>
            <option value="totalDelegated">{`${t("Sort by:")} ${t("Most Delegated")}`}</option>
            <option value="citizenCount">{`${t("Sort by:")} ${t("Most Citizens")}`}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <NativeSelect.Root size="sm" w="auto">
          <NativeSelect.Field
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value as NavigatorStatusFilter)}
            {...selectFieldStyles}>
            <option value="all">{`${t("Filter by:")} ${t("All")}`}</option>
            <option value="ACTIVE">{`${t("Filter by:")} ${t("Active")}`}</option>
            <option value="EXITING">{`${t("Filter by:")} ${t("Exiting")}`}</option>
            <option value="DEACTIVATED">{`${t("Filter by:")} ${t("Deactivated")}`}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
    </Stack>
  )
}
