import React, { useMemo, useState, useCallback } from "react"
import { HStack, VStack, Grid, Spinner, Button, MenuButton, Menu, MenuItem, MenuList } from "@chakra-ui/react"
import { AppCards } from "./AppCards"
import { GetAllApps } from "@/api"
import { useTranslation } from "react-i18next"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { FaSortAmountDown } from "react-icons/fa"
import getAllAppEndorsementStatus from "./utils/getAllAppEndorsementStatus"

type Props = {
  xApps: GetAllApps | undefined
  isXAppsLoading: boolean
}

type SortOption = "score" | "name" | "recent"

type AppWithStatus = {
  appId: string
  status: string
  name: string
  createdAtTimestamp: string
  endorsementScore: number
}

export const AllApps = ({ xApps, isXAppsLoading }: Props) => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState("All")
  const [sortOption, setSortOption] = useState<SortOption>("score")
  const xAppsAndStatus = getAllAppEndorsementStatus(xApps)

  const filterAppsByStatus = useCallback(
    (statusMap: Map<string, string>, allowedStatuses: string[]): AppWithStatus[] => {
      return Array.from(statusMap.entries())
        .filter(([_, status]) => allowedStatuses.includes(status))
        .map(([appId, status]) => {
          const app = xApps?.allApps.find(a => a.id === appId)
          return {
            appId,
            status,
            name: app?.name || "",
            createdAtTimestamp: app?.createdAtTimestamp?.toString() || "",
            // TODO : fetch the endorsement score to sort by score
            endorsementScore: 0,
            // endorsementScore: app?.endorsementScore || 0,
          }
        })
    },
    [xApps],
  )

  const filteredApps = useMemo(() => {
    return filterAppsByStatus(xAppsAndStatus, ["PENDING", "LOST", "SUCCESS"])
  }, [xAppsAndStatus, filterAppsByStatus])

  const handleSortChange = useCallback((newSortOption: SortOption) => {
    setSortOption(newSortOption)
  }, [])

  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      switch (sortOption) {
        case "score":
          return b.endorsementScore - a.endorsementScore
        case "name":
          return a.name.localeCompare(b.name)
        case "recent":
          return parseInt(b.createdAtTimestamp) - parseInt(a.createdAtTimestamp)
        default:
          return 0
      }
    })
  }, [filteredApps, sortOption])

  const appsSection = useMemo(() => {
    if (isXAppsLoading) {
      return (
        <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
          <Spinner size="lg" />
        </VStack>
      )
    }

    let displayApps: AppWithStatus[]

    switch (filter) {
      case "Active apps":
        displayApps = sortedApps.filter(app => app.status === "SUCCESS")
        break
      case "In grace period":
        displayApps = sortedApps.filter(app => app.status === "PENDING")
        break
      case "Endorsement lost":
        displayApps = sortedApps.filter(app => app.status === "LOST")
        break
      default:
        displayApps = sortedApps
    }

    return (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        {/* TODO: add the new banner */}
        {/* {filter === "All" && <AddNewAppCard />} */}
        {displayApps.map(({ appId }) => (
          <AppCards key={appId} xAppId={appId} variant="allApps" />
        ))}
      </Grid>
    )
  }, [filter, sortedApps, isXAppsLoading])

  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack
        w="full"
        overflowY="visible"
        overflowX="auto"
        spacing={4}
        justifyContent="space-between"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        <HStack>
          <FilterAppsTypeButton
            filterType="All"
            currentFilter={filter}
            setFilter={setFilter}
            isXAppsLoading={isXAppsLoading}
            xApps={xApps}
          />
          <FilterAppsTypeButton
            filterType="Active apps"
            currentFilter={filter}
            setFilter={setFilter}
            isXAppsLoading={isXAppsLoading}
            xApps={xApps}
          />
          <FilterAppsTypeButton
            filterType="In grace period"
            currentFilter={filter}
            setFilter={setFilter}
            isXAppsLoading={isXAppsLoading}
            xApps={xApps}
          />
          <FilterAppsTypeButton
            filterType="Endorsement lost"
            currentFilter={filter}
            setFilter={setFilter}
            isXAppsLoading={isXAppsLoading}
            xApps={xApps}
          />
        </HStack>

        <Menu>
          <MenuButton as={Button} rightIcon={<FaSortAmountDown />} color="#004CFC" fontSize="20px">
            {t("Sort by")}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => handleSortChange("score")}>{t("Sort by score")}</MenuItem>
            <MenuItem onClick={() => handleSortChange("name")}>{t("Sort by name")}</MenuItem>
            <MenuItem onClick={() => handleSortChange("recent")}>{t("Sort by most recent")}</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      {appsSection}
    </VStack>
  )
}
