// import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { VStack, Heading, Text } from "@chakra-ui/react"
import { useMemo } from "react"

// import dayjs from "dayjs"
import { ProposalState } from "@/hooks/proposals/grants/types"
type TimeLineElementsProps = {
  state: ProposalState
  round?: string // Some state don't have a specific round ( e.g : In Development )
  startDate: number // Unix timestamp in seconds
  endDate: number // Unix timestamp in seconds
}
export const TimelineElements = ({ state, round, startDate, endDate }: TimeLineElementsProps) => {
  const currentState = useMemo(() => {
    switch (state) {
      case ProposalState.Pending:
        return "Created" // Once it's created its directly in Support phase, so we start with 2 steps
      case ProposalState.Active:
        return "Support phase"
      case ProposalState.Defeated:
        return "Proposal Unsupported"
      case ProposalState.Completed:
        return "Project Completed"
      case ProposalState.Canceled:
        return "Project Canceled"
      case ProposalState.Succeeded:
        return "Project Succeeded"
      case ProposalState.InDevelopment:
        return "Project In development"
      case ProposalState.Queued:
        return "Project Queued"
      case ProposalState.Executed:
        return "Project Executed"
    }
  }, [state])
  // format the timeInformation to MM DD, YYYY(start round) - MM DD, YYYY(end round)
  {
    /* If it is the current state, show the round information */
  }
  {
    /* If it is not the current state, show the date MM DD, YYYY(start round) - MM DD, YYYY(end round) */
  }
  {
    /* {timeInformation} */
  }
  return (
    <VStack align="flex-start">
      <Heading size="md" fontWeight="semibold">
        {currentState}
      </Heading>
      {round && <Text>{round}</Text>}
      {startDate && <Text>{startDate}</Text>}
      {endDate && <Text>{endDate}</Text>}
    </VStack>
  )
}
