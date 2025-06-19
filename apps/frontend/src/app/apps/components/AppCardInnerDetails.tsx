import { XApp, useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { Card, CardBody, Box, Text, HStack, Skeleton, Grid, GridItem } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useXAppRoundEarnings, useXAppTotalEarnings } from "@vechain/vechain-kit"

const compactFormatter = getCompactFormatter()

type Props = { xApp: XApp }

export const AppCardInnerDetails = ({ xApp }: Props) => {
  const { t } = useTranslation()

  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  // Generate roundIds from 1 to currentRoundId or previous round if current round is not active
  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) - (currentRound.state === 0 ? 1 : 0) }, (_, i) => i + 1)
  }, [currentRoundId, currentRound])

  const previousRoundId = useMemo(() => {
    return (Number(currentRoundId) - 1).toString()
  }, [currentRoundId])

  const { data: prevRoundEarning, isLoading: prevRoundEarningLoading } = useXAppRoundEarnings(previousRoundId, xApp.id)

  const { data: totalEarnings, isLoading: totalEarningsLoading } = useXAppTotalEarnings(roundIds, xApp.id)

  return (
    <Card variant={"filled"} w="full" rounded={"xl"}>
      <CardBody>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <Box>
            <Text fontSize="md" color="gray.500">
              {t("Member since")}
            </Text>
            <Text fontSize="sm">{dayjs.unix(Number(xApp.createdAtTimestamp)).format("MMMM D, YYYY")}</Text>
          </Box>
          <Box>
            <Text fontSize="md" color="gray.500">
              {t("Accumulated")}
            </Text>
            <HStack spacing={1} fontWeight={500} align={"flex-end"}>
              <Skeleton isLoaded={!totalEarningsLoading}>
                <Text fontSize="sm">{compactFormatter.format(totalEarnings ?? 0)}</Text>
              </Skeleton>
              <Text fontSize="sm" fontWeight={400}>
                {t("B3TR")}
              </Text>
            </HStack>
          </Box>
          <GridItem colSpan={2}>
            <Box>
              <Text fontSize="md" color="gray.500">
                {t("Previous allocation")}
              </Text>
              <HStack spacing={1} fontWeight={500} align={"flex-end"}>
                <Skeleton isLoaded={!currentRoundIdLoading && !prevRoundEarningLoading}>
                  <Text fontSize="sm">{compactFormatter.format(Number(prevRoundEarning?.amount ?? 0))}</Text>
                </Skeleton>
                <Text fontSize="sm" fontWeight={400}>
                  {t("B3TR")}
                </Text>
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  )
}
