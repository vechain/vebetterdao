import { useMostVotedAppsInRound, usePreviousAllocationRoundId } from "@/api"
import { HStack, Heading, VStack, Grid, Spinner, Button } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa6"
import { useRouter } from "next/navigation"

export const AppsPageContent = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/new`)
  }

  // Apps are listed based on the votes they received in the previous round
  const { data: previousRoundId, isLoading: isLoadingPreviousRoundId } = usePreviousAllocationRoundId()
  const { data: xApps, isLoading: isLoadingXApps } = useMostVotedAppsInRound(previousRoundId ?? "")

  const isLoading = isLoadingPreviousRoundId || isLoadingXApps

  if (isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size={"lg"} />
      </VStack>
    )

  if (!xApps?.length) return null

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack w="full" justify={"space-between"}>
        <Heading size="md">{t("Explore Apps")}</Heading>
        <Button variant="primaryAction" onClick={navigateToAppDetail} leftIcon={<FaPlus />}>
          {t("Apply now")}
        </Button>
      </HStack>
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={6} w="full">
        {xApps?.map(xApp => <AppCard key={xApp.id} xApp={xApp.app} />)}

        <AddNewAppCard />
      </Grid>
    </VStack>
  )
}
