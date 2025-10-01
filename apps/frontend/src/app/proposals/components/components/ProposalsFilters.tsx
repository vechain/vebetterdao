import { Portal, Select, createListCollection } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"
import { useState } from "react"

const filters = createListCollection({
  items: [
    { label: StateFilter.DepositNotMet, value: StateFilter.DepositNotMet },
    { label: StateFilter.InDevelopment, value: StateFilter.InDevelopment },
    { label: StateFilter.Completed, value: StateFilter.Completed },
    { label: StateFilter.Pending, value: StateFilter.Pending },
    { label: StateFilter.Active, value: StateFilter.Active },
  ],
})

const defaultFilters = [ProposalFilter.InThisRound, ProposalFilter.LookingForSupport, ProposalFilter.UpcomingVoting]

export const ProposalFilters = () => {
  const { t } = useTranslation()
  const { selectedFilter, setSelectedFilter } = useProposalFilters()
  const [displayClearTrigger, setDisplayClearTrigger] = useState(false)

  return (
    <Select.Root
      multiple
      positioning={{ placement: "bottom-end", sameWidth: false }}
      collection={filters}
      size="md"
      maxW="40"
      defaultValue={defaultFilters}
      value={selectedFilter}
      onValueChange={details => {
        setDisplayClearTrigger(details.value.length > 0)
        setSelectedFilter(details.value as ProposalFilter[])
      }}>
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger rounded="xl">
          <Select.ValueText placeholder={t("Filter")} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          {displayClearTrigger && <Select.ClearTrigger />}
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>

      <Portal>
        <Select.Positioner>
          <Select.Content>
            {filters.items.map(filter => (
              <Select.Item item={filter} key={filter.value}>
                {filter.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}
