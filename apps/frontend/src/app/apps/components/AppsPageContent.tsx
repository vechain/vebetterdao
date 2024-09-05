import { useUnendorsedApps, useXApps } from "@/api"
import { HStack, VStack, Grid, Spinner, Button, useDisclosure, Text, Skeleton } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

export const AppsPageContent = () => {
  const { t } = useTranslation()

  const { data: xApps, isLoading: isLoadingXApps } = useXApps()
  const { data: unendorsedApps, isLoading: unendorsedAppsLoading } = useUnendorsedApps()

  const {
    isOpen: isActiveSection,
    onOpen: onActiveSection,
    onClose: onUnendorsedSection,
  } = useDisclosure({
    defaultIsOpen: true,
  })

  const appsSection = useMemo(() => {
    if (isActiveSection)
      return (
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={6} w="full">
          {xApps?.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}

          <AddNewAppCard />
        </Grid>
      )

    return (
      <Grid templateColumns={"repeat(1, 1fr)"} gap={6} w="full">
        {unendorsedApps?.map(xApp => <UnendorsedAppCard key={xApp.id} xApp={xApp} />)}
      </Grid>
    )
  }, [isActiveSection, xApps, unendorsedApps])

  if (isLoadingXApps)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size={"lg"} />
      </VStack>
    )

  if (!xApps?.length) return null

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack w="full">
        <Button onClick={onActiveSection} borderRadius={"24px"} bg={isActiveSection ? "#E0E9FE" : "transparent"}>
          {t("Active apps")}
        </Button>
        <Button onClick={onUnendorsedSection} borderRadius={"24px"} bg={!isActiveSection ? "#E0E9FE" : "transparent"}>
          <HStack spacing={2}>
            <Text>{t("Looking for endorsement")}</Text>
            <Skeleton isLoaded={!unendorsedAppsLoading}>
              <Text bg="#B1F16C" py="10px" px="4px" borderRadius={"38px"} fontSize={"12px"} fontWeight={700}>
                {t("{{value}} new apps", { value: unendorsedApps?.length })}
              </Text>
            </Skeleton>
          </HStack>
        </Button>
      </HStack>
      {appsSection}
    </VStack>
  )
}
