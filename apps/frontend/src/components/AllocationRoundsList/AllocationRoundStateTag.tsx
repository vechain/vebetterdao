import { RoundState } from "@/api"
import { Skeleton, Tag, TagProps, Text } from "@chakra-ui/react"

type Props = {
  state?: keyof typeof RoundState
} & TagProps
export const AllocationRoundStateTag = ({ state, ...props }: Props) => {
  const colorScheme = {
    "0": "secondary.600",
    "1": "red",
    "2": "blue",
    "-1": "gray",
  }[state ?? "-1"]

  return (
    <Skeleton isLoaded={!!state}>
      <Text color={colorScheme} fontWeight={"bold"} size="sm" {...props}>
        {state ? RoundState[state] : "Unknown"}
      </Text>
    </Skeleton>
  )
}
