import { RoundState } from "@/api"
import { HStack, Skeleton, Tag, TagProps, Text, useColorModeValue } from "@chakra-ui/react"
import { DotSymbol } from "../DotSymbol"

type Props = {
  state?: keyof typeof RoundState
  renderInTag?: boolean
} & TagProps
export const AllocationRoundStateTag = ({ state, renderInTag, ...props }: Props) => {
  const colorShade = useColorModeValue("600", "300")
  const colorScheme = {
    "0": "primary",
    "1": "red",
    "2": "green",
    "-1": "gray",
  }[state ?? "-1"]

  const isStateReady = state !== undefined

  if (renderInTag)
    return (
      <Skeleton isLoaded={isStateReady}>
        <Tag colorScheme={"gray"} {...props}>
          <HStack spacing={1} align={"center"}>
            {state === 0 && <DotSymbol color={`${colorScheme}.${colorShade}`} />}
            <Text color={`${colorScheme}.${colorShade}`} fontWeight={"500"} fontSize="medium" {...props}>
              {isStateReady ? RoundState[state] : "Unknown"}
            </Text>
          </HStack>
        </Tag>
      </Skeleton>
    )
  return (
    <Skeleton isLoaded={isStateReady}>
      <HStack spacing={1} align={"center"}>
        {state === 0 && <DotSymbol color={`${colorScheme}.${colorShade}`} />}
        <Text color={`${colorScheme}.${colorShade}`} fontWeight={"500"} fontSize="medium" {...props}>
          {isStateReady ? RoundState[state] : "Unknown"}
        </Text>
      </HStack>
    </Skeleton>
  )
}
