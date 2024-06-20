import { RoundState } from "@/api"
import { HStack, Skeleton, Tag, TagProps, Text } from "@chakra-ui/react"
import { DotSymbol } from "../DotSymbol"

type Props = {
  state?: keyof typeof RoundState
  renderInTag?: boolean
} & TagProps
export const AllocationRoundStateTag = ({ state, renderInTag, ...props }: Props) => {
  const colorScheme = {
    "0": "#3A6F00",
    "1": "#D23F63",
    "2": "#004CFC",
    "-1": "gray",
  }[state ?? "-1"]

  const isStateReady = state !== undefined

  if (renderInTag)
    return (
      <Skeleton isLoaded={isStateReady}>
        <Tag colorScheme={"gray"} {...props}>
          <HStack spacing={1} align={"center"}>
            {state === 0 && <DotSymbol color={`${colorScheme}`} />}
            <Text color={`${colorScheme}`} fontWeight={"500"} fontSize="medium" {...props}>
              {isStateReady ? RoundState[state] : "Unknown"}
            </Text>
          </HStack>
        </Tag>
      </Skeleton>
    )
  return (
    <Skeleton isLoaded={isStateReady}>
      <HStack spacing={1} align={"center"}>
        {state === 0 && <DotSymbol color={`${colorScheme}`} />}
        <Text color={`${colorScheme}`} fontWeight={"500"} fontSize="medium" {...props}>
          {isStateReady ? RoundState[state] : "Unknown"}
        </Text>
      </HStack>
    </Skeleton>
  )
}
