import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Image,
  Skeleton,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  getXAppMetadata,
  getXAppMetadataQueryKey,
  useAllocationAmount,
  useRoundXApps,
  useXAppsForecastedAmounts,
} from "@/api"
import { useMemo } from "react"
import { backdropBlurAnimation } from "@/app/theme"
import { useRouter } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import { getIpfsImage, getIpfsImageQueryKey } from "@/api/ipfs"

type Props = {
  roundId: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

const notFoundImage = "/images/image-not-found.png"

export const XAppsForecastedAmounts = ({ roundId }: Props) => {
  const router = useRouter()

  const { data: xApps } = useRoundXApps(roundId)

  const xAppsClaimableAmounts = useXAppsForecastedAmounts(xApps?.map(app => app.id) ?? [])
  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(roundId)

  const isAmountsLoading = xAppsClaimableAmounts.some(query => query.isLoading)
  const error = xAppsClaimableAmounts.find(query => query.error)?.error

  const isLoading = isAmountsLoading || roundAmountLoading

  const data = useMemo(
    () =>
      xAppsClaimableAmounts.map(app => ({
        amount: app.data?.amount ?? "0",
        name: xApps?.find(xa => xa.id === app.data?.app)?.name ?? "",
        id: app.data?.app ?? "",
      })),
    [xAppsClaimableAmounts, xApps],
  )

  const unallocatedAmount = useMemo(() => {
    if (!roundAmount) return 0

    const totalAmount = data.reduce((acc, app) => acc + Number(app.amount), 0)

    return BigInt(roundAmount.voteXAllocations) - BigInt(totalAmount)
  }, [roundAmount, data])

  const appsMetadata = useQueries({
    queries: data.map(app => ({
      queryKey: getXAppMetadataQueryKey(app.id),
      queryFn: async () => {
        return await getXAppMetadata(app.id)
      },
    })),
  })

  const logos = useQueries({
    queries: appsMetadata.map(metadata => ({
      queryKey: getIpfsImageQueryKey(metadata.data?.logo),
      queryFn: async () => {
        return await getIpfsImage(metadata.data?.logo)
      },
      enabled: !!metadata.data?.logo,
    })),
  })

  const onRoundClick = () => {
    router.push(`/rounds/${roundId}`)
  }

  return (
    <Card flex={1} h="full" w="full">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Next allocations to xApps</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Box flex={1} />
        <Stack spacing={5} w={"full"}>
          {data?.map((app, index) => {
            return (
              <HStack key={index} justify={"space-between"} alignItems={"center"}>
                <HStack spacing={0} alignItems={"start"}>
                  <Skeleton isLoaded={!logos[index]?.isLoading}>
                    <Image
                      src={logos[index]?.data?.image ?? notFoundImage}
                      alt={appsMetadata[index]?.data?.name}
                      boxSize={[6, 6, 8]}
                      borderRadius="full"
                    />
                  </Skeleton>
                  <Text fontWeight={"500"} size={"xs"}>
                    {app.name}
                  </Text>
                </HStack>
                <VStack spacing={0} alignItems={"end"}>
                  <HStack alignItems={"baseline"}>
                    <Heading size="md">{compactFormatter.format(Number(app.amount))}</Heading>
                    <Text fontSize={"xs"} fontWeight={"bold"}>
                      B3TR
                    </Text>
                  </HStack>
                  <HStack>
                    <Text fontSize={"xs"}>assigned</Text>
                  </HStack>
                </VStack>
              </HStack>
            )
          })}

          <HStack justify={"space-between"} alignItems={"center"}>
            <Text fontWeight={"500"} size={"xs"}>
              Unallocated
            </Text>
            <VStack spacing={0} alignItems={"end"}>
              <HStack alignItems={"baseline"}>
                <Heading size="md">{compactFormatter.format(Number(unallocatedAmount))}</Heading>
                <Text fontSize={"xs"} fontWeight={"bold"}>
                  B3TR
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Stack>
      </CardBody>
      {(isAmountsLoading || error) && (
        <Flex
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center"
          borderRadius={"lg"}>
          {isLoading ? (
            <Spinner size="lg" />
          ) : (
            <Alert
              w={["80%", "70%", "50%"]}
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="200px"
              borderRadius={"xl"}>
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Error loading votes
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error?.message || "An error occurred while loading allocation amounts"}
              </AlertDescription>
            </Alert>
          )}
        </Flex>
      )}

      <CardFooter>
        <HStack justify={"start"} w="full">
          <Text fontSize={"xs"}>Live data from </Text>
          <Button variant="link" colorScheme="blue" size="xs" onClick={onRoundClick}>
            Round #{roundId}
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  )
}
