import { Portal, Select, createListCollection } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalFilter, StateFilter, useProposalFilters } from "@/store"
import { useState } from "react"

const frameworks = createListCollection({
  items: [
    { label: StateFilter.Canceled, value: StateFilter.Canceled },
    { label: StateFilter.Defeated, value: StateFilter.Defeated },
    { label: StateFilter.Succeeded, value: StateFilter.Succeeded },
    { label: StateFilter.DepositNotMet, value: StateFilter.DepositNotMet },
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
      collection={frameworks}
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
            {frameworks.items.map(framework => (
              <Select.Item item={framework} key={framework.value}>
                {framework.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}
