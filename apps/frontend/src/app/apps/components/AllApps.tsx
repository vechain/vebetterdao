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
  InputGroup,
  Input,
  Icon,
  IconButton,
  Menu,
  Text,
  Center,
  Button,
  Checkbox,
  Flex,
  Portal,
} from "@chakra-ui/react"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { UilSortAmountDown, UilCheck, UilSearch, UilFilter } from "@iconscout/react-unicons"
import { APP_CATEGORIES, sortOptions, FILTER_ACTIVE_APPS } from "@/types/appDetails"

import { useAppsSorting, useAppsSearch, useAppsFiltering } from "../hooks"
import { usePagination } from "@/hooks"
import { useColorMode } from "@/components/ui/color-mode"

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
  const { colorMode } = useColorMode()

  // Color mode responsive colors
  const searchIconColor = colorMode === "light" ? "#3B3B3B" : "#E4E4E4"
  const statusHoverBg = colorMode === "light" ? "blackAlpha.800" : "whiteAlpha.800"

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
      <VStack w="full" gap={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <VStack w="full" gap={4}>
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
      <Menu.Root closeOnSelect={true} positioning={{ placement: "bottom" }}>
        <Menu.Trigger asChild>
          <IconButton
            rounded="full"
            aria-label={t("Sort by")}
            bg={"transparent"}
            transition="all 0.3s ease-in-out"
            color={"contrast-fg-on-muted"}
            _hover={{
              bg: "hover-contrast-bg",
              color: "contrast-fg-on-muted",
              transition: "all 0.3s ease-in-out",
            }}
            border={`1px solid #252525`}
            borderRadius={"24px"}
            size="md">
            <UilSortAmountDown />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              minW="100px"
              shadow="lg"
              borderRadius={"24px"}
              p={2}
              bg="info-bg"
              borderColor="contrast-border"
              borderWidth="1px">
              {sortOptions.map(option => (
                <Menu.Item
                  key={option.id}
                  value={option.id}
                  onClick={() => onSortChange(option.id)}
                  role="group"
                  borderRadius={"16px"}
                  bg={sortOption === option.id && sortOption !== "default" ? "info-bg" : undefined}
                  _hover={{
                    bg: "hover-contrast-bg",
                    color: "contrast-fg-on-muted",
                    transition: "all 0.3s ease-in-out",
                  }}>
                  <HStack justifyContent="space-between" w="full">
                    <VStack align="flex-start" gap={0}>
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
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    )
  }

  const filteringMenu = () => {
    const activeFiltersCount = selectedCategories.length || 0

    return (
      <Menu.Root closeOnSelect={false} positioning={{ placement: "bottom" }} lazyMount>
        <Menu.Trigger>
          <IconButton
            rounded="full"
            aria-label={t("Filters")}
            border={`1px solid #252525`}
            bg={"transparent"}
            color={"contrast-fg-on-muted"}
            _hover={{
              bg: "hover-contrast-bg",
              color: "contrast-fg-on-muted",
              transition: "all 0.3s ease-in-out",
            }}>
            <UilFilter />
          </IconButton>

          {activeFiltersCount > 0 && (
            <Flex
              position="absolute"
              top="-8px"
              right="-8px"
              bg={"contrast-fg-on-muted"}
              color={"contrast-fg-on-strong"}
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
        </Menu.Trigger>

        <Portal>
          <Menu.Positioner>
            <Menu.Content
              maxW="300px"
              minW="200px"
              shadow="lg"
              borderRadius={"24px"}
              p={3}
              bg="info-bg"
              borderColor="#d5d5d5"
              borderWidth="1px">
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
                    bg={statusFilter === status ? "contrast-fg-on-muted" : "contrast-bg-muted"}
                    color={statusFilter === status ? "contrast-fg-on-strong" : "contrast-fg-on-muted"}
                    borderRadius="16px"
                    border="1px solid"
                    borderColor={statusFilter === status ? "contrast-fg-on-muted" : "hover-contrast-bg"}
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

              <Menu.Separator />

              {/* Categories Section */}
              <Text fontWeight="bold" mb={2} mt={2}>
                {t("Categories")}
              </Text>
              <VStack align="start" gap={2} pl={2}>
                {APP_CATEGORIES.map(category => (
                  <Checkbox.Root
                    key={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontWeight={selectedCategories.includes(category.id) ? "semibold" : "normal"}>
                      {category.name}
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </VStack>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    )
  }

  return (
    <VStack gap={8} w="full" data-testid="apps-page">
      <HStack w="full" mt={0}>
        {headingComponent && <Box>{headingComponent}</Box>}
        <HStack gap={4} ml={headingComponent ? "auto" : 0}>
          <InputGroup
            w={headingComponent ? "300px" : "full"}
            startAddon={<UilSearch pointerEvents="none" color={searchIconColor} />}>
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
          <HStack gap={2}>
            {sortingMenu()}
            {filteringMenu()}
          </HStack>
        </HStack>
      </HStack>
      {appsSection}
    </VStack>
  )
}
