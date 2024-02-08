import { useAllocationRoundState } from "@/api"
import { Heading } from "@chakra-ui/react"

type Props = {
  roundId: string
}

export const AllocationRoundDetails: React.FC<Props> = ({ roundId }) => {
  const { data: state, error } = useAllocationRoundState(roundId)

  console.log({ state, error })

  return (
    <Heading>
      Current round: {roundId} | {state}
    </Heading>
  )
}
