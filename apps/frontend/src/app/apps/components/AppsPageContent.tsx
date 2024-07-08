import { useXApps } from "@/api"
import { HStack, Heading, VStack, Grid, Spinner, Button } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa6"

export const AppsPageContent = () => {
  const { data, isLoading } = useXApps()
  const { t } = useTranslation()

  const openGrantPage = () => {
    window.open("https://vechain.org/grants/", "_blank", "noopener noreferrer")
  }

  if (isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size={"lg"} />
      </VStack>
    )

  if (!data?.length) return null

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack w="full" justify={"space-between"}>
        <Heading size="md">{t("Explore Apps")}</Heading>
        <Button variant="primaryAction" onClick={openGrantPage} leftIcon={<FaPlus />}>
          {t("Apply now")}
        </Button>
      </HStack>
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={6} w="full">
        {data?.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}

        <AddNewAppCard />
      </Grid>
    </VStack>
  )
}
