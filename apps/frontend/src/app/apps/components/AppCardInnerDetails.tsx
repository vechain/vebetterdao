import {
  XApp,
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useXAppRoundEarnings,
  useXAppTotalEarnings,
} from "@/api"
import { Card, Box, Text, HStack, Skeleton, Grid, GridItem } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
    <Card.Root variant={"filled"} w="full" rounded={"xl"}>
      <Card.Body>
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)"]} gap={6} w="full">
          <Box>
            <Text textStyle="md" color="gray.500">
              {t("Member since")}
            </Text>
            <Text textStyle="sm">{dayjs.unix(Number(xApp.createdAtTimestamp)).format("MMMM D, YYYY")}</Text>
          </Box>
          <Box>
            <Text textStyle="md" color="gray.500">
              {t("Accumulated")}
            </Text>
            <HStack gap={1} fontWeight={500} align={"flex-end"}>
              <Skeleton loading={totalEarningsLoading}>
                <Text textStyle="sm">{compactFormatter.format(totalEarnings ?? 0)}</Text>
              </Skeleton>
              <Text textStyle="sm" fontWeight={400}>
                {t("B3TR")}
              </Text>
            </HStack>
          </Box>
          <GridItem colSpan={2}>
            <Box>
              <Text textStyle="md" color="gray.500">
                {t("Previous allocation")}
              </Text>
              <HStack gap={1} fontWeight={500} align={"flex-end"}>
                <Skeleton loading={currentRoundIdLoading || prevRoundEarningLoading}>
                  <Text textStyle="sm">{compactFormatter.format(Number(prevRoundEarning?.amount ?? 0))}</Text>
                </Skeleton>
                <Text textStyle="sm" fontWeight={400}>
                  {t("B3TR")}
                </Text>
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </Card.Body>
    </Card.Root>
  )
}
