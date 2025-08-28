import { useCallback, useState } from "react"
import { HStack, StackProps, IconButton, Button, Text, Stack, Badge } from "@chakra-ui/react"
import { MdClose } from "react-icons/md"
import { useProposalFilters, ProposalFilter, StateFilter } from "@/store"
import { useTranslation } from "react-i18next"

const filters: Record<ProposalFilter, string[]> = {
  [ProposalFilter.State]: [
    StateFilter.Canceled,
    StateFilter.Defeated,
    StateFilter.Succeeded,
    StateFilter.DepositNotMet,
  ],
  [ProposalFilter.InThisRound]: [],
  [ProposalFilter.LookingForSupport]: [],
  [ProposalFilter.UpcomingVoting]: [], // Pending
}

// The following are the default filters that are selected when no ProposalFilter.State is set
const displayFilters = Object.keys(filters).filter(
  filterKey =>
    filterKey !== ProposalFilter.InThisRound &&
    filterKey !== ProposalFilter.LookingForSupport &&
    filterKey !== ProposalFilter.UpcomingVoting,
)

const defaultFilters = [ProposalFilter.InThisRound, ProposalFilter.LookingForSupport, ProposalFilter.UpcomingVoting]

type Props = StackProps
export const ProposalsFilters = (props: Props) => {
  const { t } = useTranslation()
  const { selectedFilter, setSelectedFilter, clearFilter } = useProposalFilters()

  // if the filter is selected, we show the options
  const [isStateFilter, setIsStateFilter] = useState(false)

  const stateFilters = filters[ProposalFilter.State]

  const handleFilterClick = useCallback(
    (filter: ProposalFilter | StateFilter) => {
      const alreadySelected = selectedFilter?.includes(filter)
      if (alreadySelected) {
        let newFilters
        // When deselecting Succeeded, remove all related states
        if (filter === StateFilter.Succeeded) {
          newFilters = selectedFilter?.filter(
            f => ![StateFilter.Succeeded, StateFilter.Queued, StateFilter.Executed].includes(f as StateFilter),
          )
        } else {
          newFilters = selectedFilter?.filter(f => f !== filter)
        }

        // Only restore default filters if there are no state filters remaining
        const hasRemainingStateFilters = newFilters.some(f => stateFilters.includes(f as StateFilter))

        if (!hasRemainingStateFilters) {
          setSelectedFilter(defaultFilters)
        } else {
          setSelectedFilter(newFilters)
        }
        return
      }

      // If a state filter is selected, remove default filters
      if (stateFilters.includes(filter as StateFilter)) {
        let newFilters = [...selectedFilter.filter(f => !defaultFilters.includes(f as ProposalFilter))]

        // When selecting Succeeded, add all related states
        if (filter === StateFilter.Succeeded) {
          newFilters = [...newFilters, StateFilter.Succeeded, StateFilter.Queued, StateFilter.Executed]
        } else {
          newFilters.push(filter)
        }

        setSelectedFilter(newFilters)
      } else {
        setSelectedFilter([...selectedFilter, filter])
      }
    },
    [setSelectedFilter, selectedFilter, stateFilters],
  )

  // Check if any non-default filters are selected
  const hasNonDefaultFilters = selectedFilter.some(f => !defaultFilters.includes(f as ProposalFilter))

  return (
    <Stack
      pos="relative"
      overflowY={"visible"}
      direction={["column", "column", "row"]}
      justify={["flex-start", "flex-start", "space-between"]}
      align={["flex-end", "flex-end", "center"]}
      gap={4}
      w="full">
      {!isStateFilter ? (
        <HStack
          justifyContent={"space-between"}
          p={1}
          gap={2}
          overflowY={"visible"}
          overflowX={"auto"}
          w="full"
          // Remove scrollbar
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          {...props}>
          {displayFilters.map(filterKey => {
            const isStateButton = filterKey === ProposalFilter.State

            const onClick = () => {
              if (isStateButton) {
                setIsStateFilter(true)
              } else {
                handleFilterClick(filterKey as ProposalFilter)
              }
            }

            const stateCount = selectedFilter?.filter(f => stateFilters.includes(f)).length

            return (
              <Button
                rounded="full"
                lineHeight="inherit"
                h="auto"
                minW={"auto"}
                px={4}
                py={3}
                key={filterKey}
                onClick={onClick}>
                <HStack gap={2} alignItems={"center"}>
                  <Text textStyle="sm" fontWeight={600} whiteSpace={"nowrap"}>
                    {t("Filters")}
                  </Text>
                  {stateCount > 0 && filterKey === ProposalFilter.State && (
                    <Badge variant="solid" rounded="full" size="sm" fontSize={12} fontWeight={600} lineHeight={1}>
                      {stateCount}
                    </Badge>
                  )}
                </HStack>
              </Button>
            )
          })}
          {hasNonDefaultFilters && (
            <Button variant="plain" color="primary" onClick={clearFilter} _hover={{ textDecoration: "underline" }}>
              {t("Reset filters")}
            </Button>
          )}
        </HStack>
      ) : (
        <HStack gap={2} w="full" align={"center"}>
          <IconButton
            lineHeight="inherit"
            h="auto"
            minW={"auto"}
            variant={"outline"}
            aria-label="Clear filter"
            p={3}
            rounded="full"
            onClick={() => setIsStateFilter(false)}>
            <MdClose size={18} />
          </IconButton>

          <HStack
            overflowX={{ base: "scroll", md: "hidden" }}
            overflowY={"hidden"}
            // Remove scrollbar
            css={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            maxW={{ base: "350px", md: "100%" }}>
            {stateFilters?.map(optionKey => {
              const isSelected = selectedFilter?.includes(optionKey as StateFilter)

              return (
                <Button
                  lineHeight="inherit"
                  h="auto"
                  minW={"auto"}
                  px={4}
                  py={3}
                  rounded="full"
                  key={optionKey}
                  variant={isSelected ? "solid" : "outline"}
                  onClick={() => handleFilterClick(optionKey as StateFilter)}>
                  <Text textStyle="sm" fontWeight={600} whiteSpace={"nowrap"}>
                    {optionKey}
                  </Text>
                </Button>
              )
            })}
          </HStack>
        </HStack>
      )}
    </Stack>
  )
}
