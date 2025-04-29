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
  Center,
  Button,
} from "@chakra-ui/react"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { FaSearch } from "react-icons/fa"

const FILTER_ACTIVE_APPS = "Active apps"
const FILTER_NEW_APPS = "New apps"
const FILTER_GRACE_PERIOD = "In grace period"
const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

// TODO : double check that they is not an app that have a particular status, other than the ones we want to display
type Props = {
  currentActiveApps: XApp[]
  newApps: UnendorsedApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

type LayoutKey = "endorser" | "default"
const LOAD_MORE_APPS_COUNT = 25

export const AllApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
}: Props) => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState(FILTER_ACTIVE_APPS)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleAppsCount, setVisibleAppsCount] = useState(LOAD_MORE_APPS_COUNT)

  const showCreatorBanner = useMemo(() => filter === FILTER_ACTIVE_APPS, [filter])

  const displayApps = useMemo(() => {
    let filteredApps: (XApp | UnendorsedApp)[] = []

    // Filter xApps based on selected filter value
    switch (filter) {
      case FILTER_ACTIVE_APPS:
        filteredApps = currentActiveApps
        break
      case FILTER_NEW_APPS:
        filteredApps = newApps
        break
      case FILTER_GRACE_PERIOD:
        filteredApps = gracePeriodApps
        break
      case FILTER_ENDORSEMENT_LOST:
        filteredApps = endorsementLostApps
        break
      default:
        filteredApps = currentActiveApps
    }

    // Filter by search query if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return filteredApps.filter(app => app.name.toLowerCase().includes(query))
    }

    return filteredApps
  }, [filter, searchQuery, currentActiveApps, gracePeriodApps, endorsementLostApps, newApps])

  const displayAppsRestricted = useMemo(() => {
    return displayApps.slice(0, visibleAppsCount)
  }, [displayApps, visibleAppsCount])

  const { isEndorsingApp } = useXNode()
  const layout: LayoutKey = isEndorsingApp ? "endorser" : "default"

  const hasMoreApps = displayAppsRestricted.length < displayApps.length
  const handleLoadMore = () => {
    setVisibleAppsCount(prevApps => prevApps + LOAD_MORE_APPS_COUNT)
  }

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length
    return isXAppsLoading ? (
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
              {displayAppsRestricted.map((xApp, _) => (
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
  }, [displayAppsRestricted, isXAppsLoading, showCreatorBanner, layout, hasMoreApps])

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
              <FaSearch color="#3B3B3B" />
            </InputLeftElement>
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              borderColor="1px solid black"
              opacity={0.6}
              onChange={e => setSearchQuery(e.target.value)}
              borderRadius={"24px"}
              _dark={{ bg: "black" }}
              _hover={{ borderColor: "black", opacity: 1 }}
              _focus={{ borderColor: "black", boxShadow: "0px 0px 3px 0px rgba(0, 76, 252, 0.35)" }}
            />
          </InputGroup>
        </HStack>
        {appsSection}
      </VStack>
    </>
  )
}
