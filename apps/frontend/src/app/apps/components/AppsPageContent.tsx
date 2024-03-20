import { useXApps } from "@/api"
import { HStack, Heading, VStack, Grid, Spinner } from "@chakra-ui/react"
import { AppCard } from "./AppCard"

export const AppsPageContent = () => {
  const { data, isLoading } = useXApps()

  if (isLoading)
    return (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    )

  if (!data?.length) return null

  //TODO: Pagination, search, filters
  return (
    <VStack spacing={8}>
      <HStack w="full" justify={"space-between"}>
        <Heading size="md">Explore Apps</Heading>
      </HStack>
      <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
        {data?.map(xApp => <AppCard key={xApp.id} xApp={xApp} />)}
      </Grid>
    </VStack>
  )
}
