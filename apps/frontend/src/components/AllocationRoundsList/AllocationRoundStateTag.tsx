import { RoundState } from "@/api"
import { Skeleton, Tag, TagProps, Text } from "@chakra-ui/react"

type Props = {
  state?: keyof typeof RoundState
} & TagProps
export const AllocationRoundStateTag = ({ state, ...props }: Props) => {
  const colorScheme = {
    "0": "secondary.600",
    "1": "red",
    "2": "gray.600",
    "-1": "gray",
  }[state ?? "-1"]

  return (
    <Skeleton isLoaded={!!state}>
      <Text color={colorScheme} fontWeight={"500"} fontSize="medium" {...props}>
        {state ? RoundState[state] : "Unknown"}
      </Text>
    </Skeleton>
  )
}
