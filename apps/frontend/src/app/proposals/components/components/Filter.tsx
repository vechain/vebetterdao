import { useCallback, useState } from "react"
import { HStack, Box, Text } from "@chakra-ui/react"
import { MdClose } from "react-icons/md"

const filters: { [key: string]: string[] } = {
  State: ["Active", "Canceled", "Defeated", "Succeeded", "Queued", "Executed", "Deposit not met"],
  "In this round": [],
  "Looking for support": [],
  "Upcoming voting": [],
}

export const Filter = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>()
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<string[]>()
  const [selectedOption, setSelectedOption] = useState<string>()

  const handleFilterClick = useCallback((filter: string) => {
    if (filters[filter]?.length === 0) {
      setSelectedFilter(filter)
      setSelectedFilterOptions(undefined)
    } else {
      setSelectedFilter(filter)
      setSelectedFilterOptions(filters[filter])
    }
  }, [])

  const handleOptionClick = useCallback((option: string) => {
    setSelectedOption(option)
    setSelectedFilterOptions(undefined)
  }, [])

  const handleClearFilter = useCallback(() => {
    setSelectedFilter(undefined)
    setSelectedOption(undefined)
    setSelectedFilterOptions(undefined)
  }, [])

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
          {Object.keys(filters).map(filter => (
            <Box
              cursor={"pointer"}
              px={4}
              py={3}
              borderRadius={78}
              key={filter}
              bg={"white"}
              color={"black"}
              onClick={() => handleFilterClick(filter)}
              borderWidth={1}
              borderColor={"#EFEFEF"}
              _hover={{
                bg: "#EFEFEF",
              }}>
              <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                {filter}
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
            {selectedFilterOptions?.map(option => (
              <Box
                cursor={"pointer"}
                px={4}
                py={3}
                borderRadius={78}
                key={option}
                bg={"white"}
                color={"black"}
                onClick={() => handleOptionClick(option)}
                borderWidth={1}
                borderColor={"#EFEFEF"}
                _hover={{
                  bg: "#EFEFEF",
                }}>
                <Text fontSize={14} fontWeight={600} whiteSpace={"nowrap"}>
                  {option}
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
