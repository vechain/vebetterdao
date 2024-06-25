import { useCallback, useState } from "react"
import { HStack, Box, Text } from "@chakra-ui/react"
import { MdClose } from "react-icons/md"
import { ProposalFilter, StateFilter } from "./types"
import { useProposalFilter } from "@/store"

const filters: Record<ProposalFilter, string[]> = {
  [ProposalFilter.State]: [
    StateFilter.Active,
    StateFilter.Canceled,
    StateFilter.Defeated,
    StateFilter.Succeeded,
    StateFilter.Queued,
    StateFilter.Executed,
    StateFilter.DepositNotMet,
  ],
  [ProposalFilter.InThisRound]: [],
  [ProposalFilter.LookingForSupport]: [],
  [ProposalFilter.UpcomingVoting]: [], // Pending
}

export const Filter = () => {
  const { selectedFilter, setSelectedFilter, clearFilter } = useProposalFilter()

  const [selectedFilterOptions, setSelectedFilterOptions] = useState<string[]>()
  const [selectedOption, setSelectedOption] = useState<string>()

  const handleFilterClick = useCallback(
    (filter: ProposalFilter) => {
      if (filters[filter]?.length === 0) {
        setSelectedFilter(filter)
        setSelectedFilterOptions(undefined)
      } else {
        setSelectedFilterOptions(filters[filter])
      }
    },
    [setSelectedFilter],
  )

  const handleOptionClick = useCallback(
    (option: string) => {
      setSelectedOption(option)
      setSelectedFilterOptions(undefined)

      if (Object.values(StateFilter).includes(option as StateFilter)) {
        setSelectedFilter(option as StateFilter)
        return
      }
    },
    [setSelectedFilter],
  )

  const handleClearFilter = useCallback(() => {
    clearFilter()
    setSelectedOption(undefined)
    setSelectedFilterOptions(undefined)
  }, [clearFilter])

  return (
    <>
      {!selectedFilter && !selectedFilterOptions && (
        <HStack
          spacing={2}
          overflowX={{ base: "scroll", md: "hidden" }}
          overflowY={"hidden"}
          maxW={{ base: "380px", md: "100%" }}
          // Remove scrollbar
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
          {Object.keys(filters).map(filterKey => (
            <Box
              cursor={"pointer"}
              px={4}
              py={3}
              borderRadius={78}
              key={filterKey}
              bg={"white"}
              color={"black"}
              onClick={() => handleFilterClick(filterKey as ProposalFilter)}
              borderWidth={1}
              borderColor={"#EFEFEF"}
              _hover={{
                bg: "#EFEFEF",
              }}>
              <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                {filterKey}
              </Text>
            </Box>
          ))}
        </HStack>
      )}
      {selectedFilterOptions && (
        <HStack spacing={2}>
          <Box p={3} bg={"white"} borderRadius={"full"} borderWidth={1} borderColor={"#EFEFEF"}>
            <MdClose size={18} onClick={handleClearFilter} cursor={"pointer"} />
          </Box>

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
            {selectedFilterOptions?.map(optionKey => (
              <Box
                cursor={"pointer"}
                px={4}
                py={3}
                borderRadius={78}
                key={optionKey}
                bg={"white"}
                color={"black"}
                onClick={() => handleOptionClick(optionKey)}
                borderWidth={1}
                borderColor={"#EFEFEF"}
                _hover={{
                  bg: "#EFEFEF",
                }}>
                <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                  {optionKey}
                </Text>
              </Box>
            ))}
          </HStack>
        </HStack>
      )}
      {selectedFilter && !selectedFilterOptions && (
        <HStack spacing={2}>
          <Box p={3} bg={"white"} borderRadius={"full"} borderWidth={1} borderColor={"#EFEFEF"}>
            <MdClose size={18} onClick={handleClearFilter} cursor={"pointer"} />
          </Box>
          <HStack spacing={0} borderWidth={1} borderColor={"#EFEFEF"} borderRadius={78}>
            <Box px={4} py={3} borderRadius={78} bg={"black"} color={"white"}>
              <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                {selectedFilter}
              </Text>
            </Box>
            {selectedOption && (
              <Box px={4} py={3} borderRadius={78} color={"black"}>
                <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                  {selectedOption}
                </Text>
              </Box>
            )}
          </HStack>
        </HStack>
      )}
    </>
  )
}
