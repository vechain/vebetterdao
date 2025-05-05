import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Box,
  HStack,
  VStack,
  Grid,
  Spinner,
  GridItem,
  InputLeftElement,
  InputGroup,
  Input,
  Center,
  Button,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
} from "@chakra-ui/react"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { UilSortAmountDown, UilCheck, UilSearch } from "@iconscout/react-unicons"

import {
  useAppsSorting,
  useAppsSearch,
  useAppsFilteringByStatus,
  useAppsPagination,
  FILTER_ACTIVE_APPS,
  FILTER_NEW_APPS,
  FILTER_GRACE_PERIOD,
  FILTER_ENDORSEMENT_LOST,
} from "../hooks"

type Props = {
  currentActiveApps: XApp[]
  newApps: UnendorsedApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

const NO_APPS_PER_PAGE = 25
type LayoutKey = "endorser" | "default"

export const AllApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
}: Props) => {
  const { t } = useTranslation()
  const { isEndorsingApp } = useXNode()

  const { sortOption, sortOptions, sortedApps, isSorting, onSortChange, isSorted } = useAppsSorting(
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
  )
  const { searchQuery, handleSearchChange } = useAppsSearch()
  const { filter, setFilter, filteredApps } = useAppsFilteringByStatus(sortedApps, sortOption, searchQuery)
  const { displayAppsRestricted, hasMoreApps, handleLoadMore } = useAppsPagination(filteredApps, NO_APPS_PER_PAGE)

  const layout: LayoutKey = isEndorsingApp ? "endorser" : "default"
  const showCreatorBanner = useMemo(() => filter === FILTER_ACTIVE_APPS, [filter])

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length
    return isXAppsLoading || isSorting ? (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <VStack w="full" spacing={4}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} w="full">
          {isEmpty ? (
            <GridItem colSpan={2}>
              <AppsEmptyState />
            </GridItem>
          ) : (
            <>
              {showCreatorBanner ? <CreatorBanner /> : undefined}
              {displayAppsRestricted.map(xApp => (
                <UnendorsedAppCard key={xApp.id} xApp={xApp} layout={layout} />
              ))}
            </>
          )}
        </Grid>

        {hasMoreApps && (
          <Center w="full" py={4}>
            <Button onClick={handleLoadMore} variant="outline" borderColor="black" borderRadius="full" size="md">
              {t("Load more")}
            </Button>
          </Center>
        )}
      </VStack>
    )
  }, [t, displayAppsRestricted, isXAppsLoading, isSorting, showCreatorBanner, layout, hasMoreApps, handleLoadMore])

  const sortingMenu = () => {
    return (
      <Menu closeOnSelect={true} placement="bottom-end">
        <MenuButton
          as={IconButton}
          isRound={true}
          aria-label={t("Sort by")}
          bg={isSorted ? "black" : "transparent"}
          transition="all 0.3s ease-in-out"
          color={isSorted ? "white" : "black"}
          _hover={{
            opacity: "0.6",
            transition: "all 0.3s ease-in-out",
          }}
          icon={<UilSortAmountDown />}
          variant="black"
        />
        <MenuList minW="240px" shadow="lg" borderRadius="md" p={0}>
          {sortOptions.map(option => (
            <MenuItem
              key={option.id}
              onClick={() => onSortChange(option.id)}
              role="group"
              position="relative"
              bg={sortOption === option.id && sortOption !== "default" ? "gray.100" : undefined}
              _dark={{ bg: sortOption === option.id && sortOption !== "default" ? "gray.700" : undefined }}>
              <HStack w="full" spacing={3} justifyContent="space-between">
                <Box>
                  <Text fontWeight={sortOption === option.id && sortOption !== "default" ? "semibold" : "normal"}>
                    {option.label}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {option.description}
                  </Text>
                </Box>
                {sortOption === option.id && sortOption !== "default" && (
                  <Icon as={UilCheck} color="black" boxSize={5} />
                )}
              </HStack>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    )
  }

  return (
    <>
      <VStack spacing={8} w="full" data-testid="apps-page">
        <Box
          w="full"
          overflowX="auto"
          whiteSpace="nowrap"
          css={{
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
          <HStack spacing={4} minWidth="max-content" justifyContent="flex-start" flexWrap="nowrap">
            {[FILTER_ACTIVE_APPS, FILTER_NEW_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST].map(filterType => (
              <FilterAppsTypeButton
                key={filterType}
                filterType={filterType}
                currentFilter={filter}
                setFilter={setFilter}
              />
            ))}
          </HStack>
        </Box>
        <HStack w="full" mt={0}>
          <InputGroup w="full">
            <InputLeftElement pointerEvents="none">
              <UilSearch color="#3B3B3B" />
            </InputLeftElement>
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              borderColor="1px solid black"
              opacity={0.6}
              onChange={handleSearchChange}
              borderRadius={"24px"}
              _dark={{ bg: "black" }}
              _hover={{ borderColor: "black", opacity: 1 }}
              _focus={{ borderColor: "black", boxShadow: "0px 0px 3px 0px rgba(0, 76, 252, 0.35)" }}
            />
          </InputGroup>
          {sortingMenu()}
        </HStack>
        {appsSection}
      </VStack>
    </>
  )
}
