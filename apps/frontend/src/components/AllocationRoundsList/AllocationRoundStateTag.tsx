import { RoundState } from "@/api"
import { Skeleton, Tag, TagProps } from "@chakra-ui/react"

type Props = {
  state?: keyof typeof RoundState
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
        {state ? RoundState[state] : "Unknown"}
      </Tag>
    </Skeleton>
  )
}
