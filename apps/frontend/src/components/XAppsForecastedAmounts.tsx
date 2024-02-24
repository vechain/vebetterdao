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
  Divider,
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
import { useAllocationAmount, useRoundXApps, useXAppMetadata, useXAppsForecastedAmounts } from "@/api"
import { useMemo } from "react"
import { backdropBlurAnimation } from "@/app/theme"
import { useRouter } from "next/navigation"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"

type Props = {
  roundId: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

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
        app: xApps?.find(xa => xa.id === app.data?.appId)?.id as string,
      })),
    [xAppsClaimableAmounts, xApps],
  )

  const unallocatedAmount = useMemo(() => {
    if (!roundAmount) return 0

    const totalAmount = data.reduce((acc, app) => acc + Number(app.amount), 0)

    return BigInt(roundAmount.voteXAllocations) - BigInt(totalAmount)
  }, [roundAmount, data])

  const onRoundClick = () => {
    router.push(`/rounds/${roundId}`)
  }

  const isUnallocatedLoading = roundAmountLoading || xAppsClaimableAmounts.some(query => query.isLoading)

  return (
    <Card flex={1} h="full" w="full" variant="outline">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Next allocations to xApps</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Box flex={1} />
        <Stack spacing={5} w={"full"}>
          {data?.map(appAmount => (
            <XAppForecastedAmount key={appAmount.app} xAppId={appAmount.app} amount={appAmount.amount} />
          ))}
          <Divider />
          <HStack justify={"space-between"} alignItems={"center"}>
            <Text fontWeight={"600"} size={"xs"}>
              Unallocated
            </Text>
            <HStack alignItems={"flex-end"} spacing={1}>
              <Skeleton isLoaded={!isUnallocatedLoading}>
                <Text size="md" fontWeight={"600"} lineHeight={"16px"}>
                  {compactFormatter.format(Number(unallocatedAmount))}
                </Text>
              </Skeleton>
              <Text fontSize={"2xs"} fontWeight={"700"} lineHeight={"16x"}>
                B3TR
              </Text>
            </HStack>
          </HStack>
        </Stack>
      </CardBody>
      {(isAmountsLoading || error) && (
        <Flex
          borderRadius={"lg"}
          backdropFilter="blur(10px)"
          animation={backdropBlurAnimation("0px", "10px")}
          position={"absolute"}
          h={"100%"}
          w={"100%"}
          align="center"
          justify="center">
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

const XAppForecastedAmount = ({ xAppId, amount }: { xAppId: string; amount: string }) => {
  const { data: appMetadata, error: appMetadatError, isLoading: appMetadataLoading } = useXAppMetadata(xAppId)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  return (
    <HStack justify={"space-between"} alignItems={"center"}>
      <HStack spacing={3}>
        <Skeleton isLoaded={!isLogoLoading}>
          <Image src={logo?.image ?? notFoundImage} alt={appMetadata?.name} boxSize={8} borderRadius="9px" />
        </Skeleton>
        <Skeleton isLoaded={!appMetadataLoading}>
          <Text fontWeight={"600"} size={"xs"}>
            {appMetadata?.name}
          </Text>
        </Skeleton>
      </HStack>
      <VStack spacing={0} alignItems={"flex-end"}>
        <HStack alignItems={"flex-end"} spacing={1}>
          <Text size="md" fontWeight={"600"} lineHeight={"16px"}>
            {compactFormatter.format(Number(amount))}
          </Text>
          <Text fontSize={"2xs"} fontWeight={"700"} lineHeight={"16x"}>
            B3TR
          </Text>
        </HStack>
        <HStack>
          <Text fontSize={"xs"} fontWeight={"400"}>
            assigned
          </Text>
        </HStack>
      </VStack>
    </HStack>
  )
}
