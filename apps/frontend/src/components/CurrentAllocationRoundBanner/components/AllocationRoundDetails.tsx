import { AllocationRoundWithState, useCurrentBlock } from "@/api"
import { Box, Button, HStack, Heading, Text } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useMemo } from "react"

type Props = {
  round: AllocationRoundWithState
}

const blockTime = getConfig().network.blockTime

export const AllocationRoundDetails: React.FC<Props> = ({ round }) => {
  const { data: currentBlock } = useCurrentBlock()
  const estimatedEndTime = useMemo(() => {
    const endBlock = Number(round.voteEnd)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    //not ended yet
    if (endBlockFromNow > 0) {
      const durationLeftTimestamp = endBlockFromNow * blockTime
      const endDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    } else {
      const durationLeftTimestamp = -endBlockFromNow * blockTime
      const endDate = dayjs().subtract(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    }
  }, [currentBlock, round])

  return (
    <HStack w="full" justify="space-between">
      <Box>
        <Heading size="lg">Current allocation's voting</Heading>
        <Text fontSize="lg" fontWeight={"medium"}>
          Ends {estimatedEndTime}
        </Text>
      </Box>
      <Button>Vote now</Button>
    </HStack>
  )
}
