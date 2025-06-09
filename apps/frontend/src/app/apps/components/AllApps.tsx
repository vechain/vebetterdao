import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Box,
  Badge,
  HStack,
  VStack,
  Grid,
  Spinner,
  GridItem,
  InputLeftElement,
  InputGroup,
  Input,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Center,
  Button,
  Checkbox,
  Flex,
  MenuDivider,
  useColorModeValue,
} from "@chakra-ui/react"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { UilSortAmountDown, UilCheck, UilSearch, UilFilter } from "@iconscout/react-unicons"
import { APP_CATEGORIES, sortOptions, FILTER_ACTIVE_APPS } from "@/types/appDetails"

import { useAppsSorting, useAppsSearch, useAppsFiltering } from "../hooks"
import { usePagination } from "@/hooks"

type Props = {
  currentActiveApps: XApp[]
  newApps: UnendorsedApp[] | XApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
  headingComponent?: React.ReactNode
}

type LayoutKey = "endorser" | "default"

export const AllApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
  headingComponent,
}: Props) => {
  const { t } = useTranslation()
  const { isEndorsingApp } = useXNode()

  // Color mode responsive colors
  const searchIconColor = useColorModeValue("#3B3B3B", "#E4E4E4")
  const statusHoverBg = useColorModeValue("blackAlpha.800", "whiteAlpha.800")

  const { sortOption, sortedApps, appWithStatusCounts, isSorting, onSortChange } = useAppsSorting(
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
  )
  const { searchQuery, handleSearchChange } = useAppsSearch()
  const { setStatusFilter, toggleCategoryFilter, filteredApps, statusFilterOptions, statusFilter } = useAppsFiltering(
    sortedApps,
    sortOption,
    searchQuery,
  )

  const itemsPerPage = 25
  const { currentItems: displayAppsRestricted, hasMore, loadMore } = usePagination(filteredApps, itemsPerPage)

  const layout: LayoutKey = isEndorsingApp ? "endorser" : "default"
  const showCreatorBanner = useMemo(() => statusFilter === FILTER_ACTIVE_APPS, [statusFilter])

  // State for selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev: string[]) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id: string) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
    toggleCategoryFilter(categoryId)
  }

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length // if no apps, show empty state
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

        {hasMore && (
          <Center w="full" py={4}>
            <Button onClick={loadMore} variant="outline" borderColor="black" borderRadius="full" size="md">
              {t("Load more")}
            </Button>
          </Center>
        )}
      </VStack>
    )
  }, [t, displayAppsRestricted, isXAppsLoading, isSorting, showCreatorBanner, layout, hasMore, loadMore])

  const sortingMenu = () => {
    return (
      <Menu closeOnSelect={true} placement="bottom" flip={false}>
        <MenuButton
          as={IconButton}
          isRound={true}
          aria-label={t("Sort by")}
          bg={"transparent"}
          transition="all 0.3s ease-in-out"
          color={"filter-unselected-text"}
          _hover={{
            bg: "statusHoverBg",
            transition: "all 0.3s ease-in-out",
          }}
          border={`1px solid #252525`}
          borderRadius={"24px"}
          icon={<UilSortAmountDown />}
          size="md"
        />
        <MenuList minW="100px" shadow="lg" borderRadius={"24px"} p={2}>
          {sortOptions.map(option => (
            <MenuItem
              key={option.id}
              onClick={() => onSortChange(option.id)}
              role="group"
              borderRadius={"16px"}
              bg={sortOption === option.id && sortOption !== "default" ? "#D5D5D5" : undefined}
              _hover={{ bg: "#D5D5D5" }}>
              <HStack justifyContent="space-between" w="full">
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight={sortOption === option.id && sortOption !== "default" ? "semibold" : "normal"}>
                    {option.label}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {option.description}
                  </Text>
                </VStack>
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

  const filteringMenu = () => {
    const activeFiltersCount = selectedCategories.length || 0

    return (
      <Menu closeOnSelect={false} placement="bottom" strategy="fixed" autoSelect={false} isLazy flip={false}>
        <Box position="relative">
          <MenuButton
            as={IconButton}
            isRound={true}
            aria-label={t("Filters")}
            border={`1px solid #252525`}
            icon={<UilFilter />}
            bg={"transparent"}
            color={"filter-unselected-text"}
            _hover={{
              bg: "hover-contrast-bg",
              color: "filter-unselected-text",
              transition: "all 0.3s ease-in-out",
            }}
          />

          {activeFiltersCount > 0 && (
            <Flex
              position="absolute"
              top="-8px"
              right="-8px"
              bg={"filter-unselected-text"}
              color={"filter-selected-text"}
              borderRadius="full"
              w="20px"
              h="20px"
              justify="center"
              align="center"
              fontSize="xs"
              fontWeight="bold"
              boxShadow="0px 0px 4px rgba(0, 0, 0, 0.2)">
              {activeFiltersCount}
            </Flex>
          )}
        </Box>
        <MenuList maxW="300px" minW="200px" shadow="lg" borderRadius={"24px"} p={3}>
          {/* Governance Status Section */}
          <Text fontWeight="bold" mb={2}>
            {t("Status")}
          </Text>
          <Flex flexWrap="wrap" gap={2} mb={4} flexDir="column">
            {statusFilterOptions.map(status => (
              <Button
                key={status}
                size="sm"
                onClick={() => setStatusFilter(status)}
                bg={statusFilter === status ? "filter-selected-bg" : "filter-unselected-bg"}
                color={statusFilter === status ? "filter-selected-text" : "filter-unselected-text"}
                borderRadius="16px"
                border="1px solid"
                borderColor={statusFilter === status ? "filter-unselected-text" : "hover-contrast-bg"}
                _hover={{
                  bg: statusFilter === status ? statusHoverBg : "hover-contrast-bg",
                }}
                px={3}
                py={1}
                fontWeight="medium">
                {status}{" "}
                {statusFilter === status && (
                  <Badge ml={1} color="black" borderRadius="full">
                    {appWithStatusCounts[status as keyof typeof appWithStatusCounts]}
                  </Badge>
                )}
              </Button>
            ))}
          </Flex>

          <MenuDivider />

          {/* Categories Section */}
          <Text fontWeight="bold" mb={2} mt={2}>
            {t("Categories")}
          </Text>
          <VStack align="start" spacing={2} pl={2}>
            {APP_CATEGORIES.map(category => (
              <Checkbox
                key={category.id}
                isChecked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryChange(category.id)}
                fontWeight={selectedCategories.includes(category.id) ? "semibold" : "normal"}
                colorScheme="contrast">
                <Flex align="center">{category.name}</Flex>
              </Checkbox>
            ))}
          </VStack>
        </MenuList>
      </Menu>
    )
  }

  return (
    <VStack spacing={8} w="full" data-testid="apps-page">
      <HStack w="full" mt={0}>
        {headingComponent && <Box>{headingComponent}</Box>}
        <HStack spacing={4} ml={headingComponent ? "auto" : 0}>
          <InputGroup w={headingComponent ? "300px" : "full"}>
            <InputLeftElement pointerEvents="none">
              <UilSearch color={searchIconColor} />
            </InputLeftElement>
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              border={`1px solid #252525`}
              opacity={0.6}
              onChange={handleSearchChange}
              borderRadius={"24px"}
              _hover={{ borderColor: "hover-contrast-bg", opacity: 0.9 }}
              _focus={{
                borderColor: "hover-contrast-bg",
                boxShadow: `0px 0px 3px 0px ${"hover-contrast-bg"}`,
                opacity: 0.8,
              }}
            />
          </InputGroup>
          <HStack spacing={2}>
            {sortingMenu()}
            {filteringMenu()}
          </HStack>
        </HStack>
      </HStack>
      {appsSection}
    </VStack>
  )
}
