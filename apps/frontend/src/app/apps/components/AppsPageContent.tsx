import { useXApps } from "@/api"
import { HStack, Heading, VStack, Grid } from "@chakra-ui/react"
import { AppCard } from "./AppCard"

export const AppsPageContent = () => {
  const { data: xApps } = useXApps()

  if (!xApps?.length) return null

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8}>
      <HStack w="full" justify={"space-between"}>
        <Heading size="md">Explore dApps</Heading>
      </HStack>
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
        {xApps?.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}
      </Grid>
    </VStack>
  )
}
