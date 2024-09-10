import { useUserEndorsementScore, useXApps } from "@/api"
import { HStack, VStack, Grid, Spinner, Button, useDisclosure, Text, Skeleton, Box, Heading } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { useWallet } from "@vechain/dapp-kit-react"

export const AppsPageContent = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data: xApps, isLoading: isXAppsLoading } = useXApps()

  const userEndorsementScore = useUserEndorsementScore(account)

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
      <Grid templateColumns={"repeat(1, 1fr)"} gap={6} w="full">
        {xApps?.unendorsed.map(xApp => <UnendorsedAppCard key={xApp.id} xApp={xApp} />)}
      </Grid>
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
      <Box alignSelf={"flex-start"}>
        <Heading size="lg">{userEndorsementScore.data}</Heading>
        <Text>{t("Endorsement score")}</Text>
      </Box>
      <HStack w="full">
        <Button onClick={onActiveSection} borderRadius={"24px"} bg={isActiveSection ? "#E0E9FE" : "transparent"}>
          {t("Active apps")}
        </Button>
        <Button onClick={onUnendorsedSection} borderRadius={"24px"} bg={!isActiveSection ? "#E0E9FE" : "transparent"}>
          <HStack spacing={2}>
            <Text>{t("Looking for endorsement")}</Text>
            <Skeleton isLoaded={!isXAppsLoading}>
              <Text bg="#B1F16C" py="10px" px="4px" borderRadius={"38px"} fontSize={"12px"} fontWeight={700}>
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
