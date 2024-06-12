import {
  XApp,
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useXAppRoundEarnings,
  useXAppTotalEarnings,
} from "@/api"
import { Card, CardBody, Box, Stack, Text, HStack, Skeleton, Grid, GridItem } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { i } from "vitest/dist/reporters-P7C2ytIv"

const compactFormatter = getCompactFormatter()

type Props = { xApp: XApp }

export const AppCardInnerDetails = ({ xApp }: Props) => {
  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  // Generate roundIds from 1 to currentRoundId or previous round if current round is not active
  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) - (currentRound.state === 0 ? 1 : 0) }, (_, i) =>
      (i + 1).toString(),
    )
  }, [currentRoundId, currentRound])

  const previousRoundId = useMemo(() => {
    return (Number(currentRoundId) - 1).toString()
  }, [currentRoundId])

  const { data: prevRoundEarning, isLoading: prevRoundEarningLoading } = useXAppRoundEarnings(previousRoundId, xApp.id)

  const amounts = useXAppTotalEarnings(roundIds, xApp.id)
  const isAmountsLoading = amounts.some(amount => amount.isLoading)
  const totalAmount = amounts.reduce((acc, amount) => acc + Number(amount.data?.amount), 0)

  return (
    <Card variant={"filled"} w="full" rounded={"xl"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <Box>
            <Text fontSize="md" color="gray.500">
              Member since
            </Text>
            <Text fontSize="sm">{dayjs.unix(xApp.createdAtTimestamp).format("MMMM D, YYYY")}</Text>
          </Box>
          <Box>
            <Text fontSize="md" color="gray.500">
              Accumulated
            </Text>
            <HStack spacing={1} fontWeight={500} align={"flex-end"}>
              <Skeleton isLoaded={!isAmountsLoading}>
                <Text fontSize="sm">{compactFormatter.format(totalAmount ?? 0)}</Text>
              </Skeleton>
              <Text fontSize="sm" fontWeight={400}>
                B3TR
              </Text>
            </HStack>
          </Box>
          <GridItem colSpan={2}>
            <Box>
              <Text fontSize="md" color="gray.500">
                Previous allocation
              </Text>
              <HStack spacing={1} fontWeight={500} align={"flex-end"}>
                <Skeleton isLoaded={!currentRoundIdLoading && !prevRoundEarningLoading}>
                  <Text fontSize="sm">{compactFormatter.format(Number(prevRoundEarning?.amount ?? 0))}</Text>
                </Skeleton>
                <Text fontSize="sm" fontWeight={400}>
                  B3TR
                </Text>
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  )
}
