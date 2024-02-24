import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  HStack,
  Heading,
  Skeleton,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useAllocationAmount, useAllocationsRound, useRoundXApps, useXAppMetadata, useXAppRoundEarnings } from "@/api"
import { useMemo } from "react"
import { backdropBlurAnimation } from "@/app/theme"
import { useMultipleXAppsRoundEarnings } from "@/api/contracts/xAllocationPool/hooks/useMultipleXAppsRoundEarnings"
import { BaseTooltip } from "../BaseTooltip"
import { DotSymbol } from "../DotSymbol"
import { AppAmount } from "./components/AppAmount"

type Props = {
  roundId: string
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const CurrentRoundAllocations = ({ roundId }: Props) => {
  const { data: xApps } = useRoundXApps(roundId)
  const xAppsClaimableAmounts = useMultipleXAppsRoundEarnings(roundId, xApps?.map(app => app.id) ?? [])
  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(roundId)
  const { data: round } = useAllocationsRound(roundId)

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

  const isUnallocatedLoading = roundAmountLoading || xAppsClaimableAmounts.some(query => query.isLoading)

  return (
    <Card flex={1} h="full" w="full" variant="outline">
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Round #{roundId} allocations </Heading>
          {round?.state === "0" && (
            <BaseTooltip
              text={"Round is still active, final results could change if quorum is not reached"}
              children={
                <Tag colorScheme="inherit" size={"lg"} style={{ cursor: "default" }}>
                  <HStack spacing={1} align={"center"}>
                    <DotSymbol color="secondary.500" />
                    <Text fontSize={"sm"}>Active</Text>
                  </HStack>
                </Tag>
              }
            />
          )}
        </HStack>
      </CardHeader>
      <CardBody>
        <Box flex={1} />
        <Stack spacing={5} w={"full"}>
          {data?.map(appAmount => <AppAmount key={appAmount.app} xAppId={appAmount.app} amount={appAmount.amount} />)}
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
    </Card>
  )
}
