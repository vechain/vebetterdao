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
  Link,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRoundXApps, useXAppsForecastedAmounts } from "@/api"
import { useMemo } from "react"
import { backdropBlurAnimation } from "@/app/theme"
import { useRouter } from "next/navigation"

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
  console.log("xAppsClaimableAmounts", xAppsClaimableAmounts)

  const isAmountsLoading = xAppsClaimableAmounts.some(query => query.isLoading)
  const error = xAppsClaimableAmounts.find(query => query.error)?.error

  const isLoading = isAmountsLoading

  const data = useMemo(
    () =>
      xAppsClaimableAmounts.map(app => ({
        amount: app.data?.amount ?? "0",
        app: xApps?.find(xa => xa.id === app.data?.app)?.name ?? "",
      })),
    [xAppsClaimableAmounts, xApps],
  )

  const onRoundClick = () => {
    router.push(`/rounds/${roundId}`)
  }

  return (
    <Card flex={1} h="full" w="full">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="lg">Most voted xApps</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Box flex={1} />
        <Stack spacing={5} w={"full"}>
          {data?.map(app => {
            return (
              <HStack justify={"space-between"} alignItems={"center"}>
                <Text fontWeight={"500"} size={"xs"}>
                  {app.app}
                </Text>
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
