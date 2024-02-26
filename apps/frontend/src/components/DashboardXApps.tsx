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
  Grid,
  useColorModeValue,
  IconButton,
  Button,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { FiArrowUpRight } from "react-icons/fi"

export const DashboardXApps = () => {
  const { data: xApps } = useXApps()

  const slicedXApps = useMemo(() => xApps?.slice(0, 4), [xApps])

  if (!slicedXApps?.length) return null

  return (
    <Card>
      <CardHeader>
        <HStack w="full" justify={"space-between"}>
          <Heading size="md">Explore dApps</Heading>
          {slicedXApps && slicedXApps.length > 4 && (
            <Button variant="link" colorScheme="blue" rightIcon={<FiArrowUpRight />}>
              See all
            </Button>
          )}
        </HStack>
      </CardHeader>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          {slicedXApps?.map(xApp => <XApp key={xApp.id} xApp={xApp} />)}
        </Grid>
      </CardBody>
    </Card>
  )
}

const XApp = ({ xApp }: { xApp: XApp }) => {
  const { data: appMetadata, isLoading: appMetadataLoading, isError: isAppMetadataError } = useXAppMetadata(xApp.id)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const buttonIconColor = useColorModeValue("primary.500", "white")

  return (
    <Card variant={"baseWithBorder"}>
      <CardBody>
        <VStack alignItems={"start"} justify={"flex-start"}>
          <HStack spacing={1} justifyContent={"space-between"} w={"full"}>
            <Skeleton isLoaded={!isLogoLoading} alignContent={"start"}>
              <Image
                src={logo?.image ?? notFoundImage}
                alt={"logo"}
                boxSize={10}
                borderRadius="9px"
                w={"fit-content"}
              />
            </Skeleton>

            <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
              <IconButton
                isRound={true}
                variant="solid"
                aria-label="Go to dApp"
                fontSize="20px"
                disabled={isAppMetadataError}
                onClick={() => window.open(appMetadata?.external_url, "_blank")}
                color={buttonIconColor}
                icon={<FiArrowUpRight />}
              />
            </Skeleton>
          </HStack>

          <VStack spacing={1} align="flex-start">
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontWeight={"600"} size={"xs"}>
                {appMetadata?.name ?? isAppMetadataError ?? "Error loading name"}
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text fontSize={"sm"} color={"gray.500"}>
                {appMetadata?.description ?? isAppMetadataError ?? "Error loading description"}
              </Text>
            </Skeleton>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
