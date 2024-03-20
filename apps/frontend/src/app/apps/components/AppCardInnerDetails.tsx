import {
  XApp,
  useAllocationsRound,
  useCurrentAllocationsRoundId,
  useXAppRoundEarnings,
  useXAppTotalEarnings,
} from "@/api"
import { B3TRIcon } from "@/components"
import { Card, CardBody, Box, Stack, Text, HStack, Heading } from "@chakra-ui/react"
import { compactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useMemo } from "react"

type Props = { xApp: XApp }

export const AppCardInnerDetails = ({ xApp }: Props) => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  // Generate roundIds from 1 to currentRoundId or previous round if current round is not active
  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) - (currentRound.state === "0" ? 1 : 0) }, (_, i) =>
      (i + 1).toString(),
    )
  }, [currentRoundId, currentRound])

  const previousRoundId = useMemo(() => {
    return (Number(currentRoundId) - 1).toString()
  }, [currentRoundId])

  const { data: prevRoundEarning } = useXAppRoundEarnings(previousRoundId, xApp.id)

  const amounts = useXAppTotalEarnings(roundIds, xApp.id)
  const totalAmount = amounts.reduce((acc, amount) => acc + Number(amount.data?.amount), 0)

  return (
    <Card variant={"inner"} w="full">
      <CardBody>
        <Stack w="full" spacing={4} direction={["column", "row"]} justify={"space-between"}>
          <Box fontWeight={500}>
            <Text fontSize="md" color="gray.500">
              Member since
            </Text>
            <Text fontSize="lg">{dayjs(xApp.createdAt).format("MMMM D, YYYY")}</Text>
          </Box>

          <Box>
            <Text fontSize="md" color="gray.500">
              Last allocation
            </Text>
            <HStack spacing={1} fontWeight={500}>
              <Text fontSize="lg">{compactFormatter.format(Number(prevRoundEarning?.amount))}</Text>
              <B3TRIcon boxSize={5} />
            </HStack>
          </Box>
          <Box>
            <Text fontSize="md" color="gray.500">
              Accumulated
            </Text>
            <HStack spacing={1} fontWeight={500}>
              <Text fontSize="lg">{compactFormatter.format(totalAmount)}</Text>
              <B3TRIcon boxSize={5} />
            </HStack>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  )
}
