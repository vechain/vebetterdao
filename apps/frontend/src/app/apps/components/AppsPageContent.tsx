import { useXApps } from "@/api"
import { HStack, VStack, Grid, Spinner, Button, useDisclosure, Text, Skeleton, Heading } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { EndorsementPointsBanner } from "./EndorsementPointsBanner"

export const AppsPageContent = () => {
  const { t } = useTranslation()

  const { data: xApps, isLoading: isXAppsLoading } = useXApps()

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
          {xApps?.active.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}

          <AddNewAppCard />
        </Grid>
      )

    return (
      <VStack w="full" spacing={8}>
        <EndorsementPointsBanner />
        <Grid templateColumns={"repeat(1, 1fr)"} gap={6} w="full">
          {xApps?.unendorsed.map(xApp => <UnendorsedAppCard key={xApp.id} xApp={xApp} />)}
        </Grid>
      </VStack>
    )
  }, [isActiveSection, xApps])

  if (isXAppsLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size={"lg"} />
      </VStack>
    )

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack
        w="full"
        overflowY={"visible"}
        overflowX={"auto"}
        spacing={4}
        // Remove scrollbar
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        <Button
          w="auto"
          h="auto"
          minW={"auto"}
          variant="ghost"
          onClick={onActiveSection}
          borderRadius={"24px"}
          px={"24px"}
          py="16px"
          bg={isActiveSection ? "#E0E9FE" : "transparent"}>
          <Heading fontWeight={isActiveSection ? 700 : 500} fontSize={"20px"}>
            {t("Active apps")}
          </Heading>
        </Button>
        <Button
          w="auto"
          h="auto"
          minW={"auto"}
          variant="ghost"
          onClick={onUnendorsedSection}
          borderRadius={"24px"}
          px={"24px"}
          py="16px"
          fontWeight={!isActiveSection ? 700 : 500}
          fontSize={"20px"}
          bg={!isActiveSection ? "#E0E9FE" : "transparent"}>
          <HStack spacing={2}>
            <Heading fontWeight={!isActiveSection ? 700 : 500} fontSize={"20px"}>
              {t("Looking for endorsement")}
            </Heading>
            <Skeleton isLoaded={!isXAppsLoading}>
              <Text
                bg="#B1F16C"
                py="10px"
                px="4px"
                borderRadius={"38px"}
                fontSize={"12px"}
                fontWeight={700}
                lineHeight={0}>
                {t("{{value}} new apps", { value: xApps?.unendorsed?.length })}
              </Text>
            </Skeleton>
          </HStack>
        </Button>
      </HStack>
      {appsSection}
    </VStack>
  )
}
