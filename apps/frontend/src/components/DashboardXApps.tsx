import { XApp, useXAppMetadata, useXApps } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import {
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Image,
  Skeleton,
  Text,
  VStack,
  Button,
  Stack,
  Box,
  Grid,
  useColorModeValue,
} from "@chakra-ui/react"

export const DashboardXApps = () => {
  const { data: xApps, isLoading, isError } = useXApps()
  return (
    <Card>
      <CardHeader>
        <HStack w="full" justify={"space-between"}>
          <Heading size="md">Explore dApps</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          {xApps?.map(xApp => <XApp key={xApp.id} xApp={xApp} />)}
        </Grid>
      </CardBody>
    </Card>
  )
}

const XApp = ({ xApp }: { xApp: XApp }) => {
  const { data: appMetadata, error: appMetadatError, isLoading: appMetadataLoading } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const formatDescription = (description: string) => {
    if (description.length > 100) {
      return `${description.slice(0, 110)}…`
    }
    return description
  }

  return (
    <Card variant={"baseWithBorder"}>
      <CardBody>
        <VStack alignItems={"start"} justify={"flex-start"}>
          <HStack spacing={1}>
            <Skeleton isLoaded={!isLogoLoading} w={"full"} alignContent={"start"}>
              <Image
                src={logo?.image ?? notFoundImage}
                alt={appMetadata?.name}
                boxSize={10}
                borderRadius="9px"
                w={"fit-content"}
              />
            </Skeleton>
            <Button variant={"link"} alignContent={"end"}>
              Open
            </Button>
          </HStack>

          <VStack spacing={1} align="flex-start">
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontWeight={"600"} size={"xs"}>
                {appMetadata?.name}
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text size={"xs"} color={"gray.500"}>
                {formatDescription(appMetadata?.description ?? "No description for this app")}
              </Text>
            </Skeleton>
          </VStack>
        </VStack>
        <VStack spacing={0} alignItems={"flex-end"}></VStack>
      </CardBody>
    </Card>
  )
}
