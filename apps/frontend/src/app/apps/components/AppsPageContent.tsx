import { useXApps } from "@/api"
import { HStack, Heading, VStack, Grid, Spinner, GridItem } from "@chakra-ui/react"
import { AppCard } from "./AppCard"
import { AddNewAppCard } from "./AddNewAppCard"

export const AppsPageContent = () => {
  const { data, isLoading } = useXApps()

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
        <Heading size="md">Explore Apps</Heading>
      </HStack>
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={6} w="full">
        {data?.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}

        <AddNewAppCard />
      </Grid>
    </VStack>
  )
}
