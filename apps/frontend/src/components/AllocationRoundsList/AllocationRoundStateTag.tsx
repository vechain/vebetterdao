import { AllocationProposalState } from "@/api"
import { Skeleton, Tag, TagProps } from "@chakra-ui/react"

type Props = {
  state?: keyof typeof AllocationProposalState
} & TagProps
export const AllocationRoundStateTag = ({ state, ...props }: Props) => {
  const colorScheme = {
    "0": "green",
    "1": "red",
    "2": "blue",
    "-1": "gray",
  }[state ?? "-1"]

  return (
    <Skeleton isLoaded={!!state}>
      <Tag colorScheme={colorScheme} size="sm" {...props}>
        {state ? AllocationProposalState[state] : "Unknown"}
      </Tag>
    </Skeleton>
  )
}
