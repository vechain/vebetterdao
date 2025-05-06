import { useMemo, useState } from "react"
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
} from "@chakra-ui/react"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { UilSortAmountDown, UilCheck, UilSearch, UilFilter } from "@iconscout/react-unicons"

import { APP_CATEGORIES, FILTER_ACTIVE_APPS } from "@/types/appDetails"

import { useAppsSorting, useAppsSearch, useAppsFiltering } from "../hooks"
import { usePagination } from "@/hooks"

type Props = {
  currentActiveApps: XApp[]
  newApps: UnendorsedApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

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
  const { setStatusFilter, toggleCategoryFilter, filteredApps, statusFilter, statusFilterOptions } = useAppsFiltering(
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
    const isEmpty = !displayAppsRestricted?.length // if no apps or no categories selected, show empty state
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
  }, [t, displayAppsRestricted, isXAppsLoading, isSorting, showCreatorBanner, layout])

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

  const filteringMenu = () => {
    return (
      <Menu closeOnSelect={false} placement="bottom-end">
        <MenuButton
          as={IconButton}
          isRound={true}
          aria-label={t("Filters")}
          icon={<UilFilter />}
          variant="black"
          bg={statusFilter !== FILTER_ACTIVE_APPS || selectedCategories.length > 0 ? "black" : "transparent"}
          color={statusFilter !== FILTER_ACTIVE_APPS || selectedCategories.length > 0 ? "white" : "black"}
        />
        <MenuList minW="280px" shadow="lg" borderRadius="md" p={3}>
          {/* Governance Status Section */}
          <Text fontWeight="bold" mb={2}>
            {t("Status")}
          </Text>
          <VStack align="start" spacing={2} mb={4} pl={2}>
            {statusFilterOptions.map(status => (
              <Checkbox
                key={status}
                isChecked={statusFilter === status}
                onChange={() => setStatusFilter(status)}
                colorScheme="blackAlpha">
                {status}
              </Checkbox>
            ))}
          </VStack>

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
                colorScheme="blackAlpha">
                <Flex align="center">
                  <Box w="12px" h="12px" borderRadius="full" bg={category.color} mr={2} />
                  {category.name}
                </Flex>
              </Checkbox>
            ))}
          </VStack>
        </MenuList>
      </Menu>
    )
  }

  return (
    <>
      <VStack spacing={8} w="full" data-testid="apps-page">
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
          {filteringMenu()}
        </HStack>
        {appsSection}
      </VStack>
    </>
  )
}
