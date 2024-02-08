import { AllocationProposalCreated, AllocationRoundWithState, useCurrentBlock } from "@/api"
import { Box, Button, Card, CardBody, HStack, Heading, Text } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import Head from "next/head"
import { useMemo } from "react"

type Props = {
  round: AllocationProposalCreated
}

const blockTime = getConfig().network.blockTime

export const AllocationRoundCard: React.FC<Props> = ({ round }) => {
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
    <Card w="full">
      <CardBody>
        <Box>
          <Heading as="h3" size="md">
            Round #{round.proposalId}
          </Heading>
          <Text>{estimatedEndTime}</Text>
        </Box>
      </CardBody>
    </Card>
  )
}
