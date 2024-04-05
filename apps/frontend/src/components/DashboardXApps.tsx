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
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { FiArrowUpRight } from "react-icons/fi"

type Props = {
  maxApps?: number
}
export const DashboardXApps = ({ maxApps = 5 }: Props) => {
  const { data: xApps } = useXApps()

  const slicedXApps = useMemo(() => xApps?.slice(0, maxApps), [xApps, maxApps])

  if (!slicedXApps?.length) return null

  return (
    <Card>
      <CardHeader>
        <HStack w="full" justify={"space-between"}>
          <Heading size="md">Explore Apps</Heading>
          {slicedXApps && slicedXApps.length > maxApps && (
            <Button variant="link" colorScheme="blue" rightIcon={<FiArrowUpRight />}>
              See all
            </Button>
          )}
        </HStack>
      </CardHeader>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          {slicedXApps?.map(xApp => <DashboardXAppCard key={xApp.id} xApp={xApp} />)}
        </Grid>
      </CardBody>
    </Card>
  )
}

const DashboardXAppCard = ({ xApp }: { xApp: XApp }) => {
  const {
    data: appMetadata,
    isLoading: appMetadataLoading,
    isError: isAppMetadataError,
    error: appMetadataError,
  } = useXAppMetadata(xApp.id)
  const router = useRouter()
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const buttonIconColor = useColorModeValue("primary.500", "white")

  const navigateToAppDetail = useCallback(() => {
    router.push(`/apps/${xApp.id}`)
  }, [router, xApp.id])
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
                _hover={{
                  cursor: "pointer",
                }}
                onClick={navigateToAppDetail}
              />
            </Skeleton>

            <Skeleton isLoaded={!appMetadataLoading} justifyContent={"end"}>
              <IconButton
                isRound={true}
                variant="solid"
                aria-label="Go to App"
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
              <Text
                fontWeight={"600"}
                size={"xs"}
                _hover={{
                  cursor: "pointer",
                }}
                onClick={navigateToAppDetail}>
                {appMetadata?.name ?? appMetadataError?.message ?? "Error loading name"}
              </Text>
            </Skeleton>
            <Skeleton isLoaded={!appMetadataLoading}>
              <Text
                fontSize={"sm"}
                color={"gray.500"}
                _hover={{
                  cursor: "pointer",
                }}
                onClick={navigateToAppDetail}>
                {appMetadata?.description ?? appMetadataError?.message ?? "Error loading description"}
              </Text>
            </Skeleton>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
