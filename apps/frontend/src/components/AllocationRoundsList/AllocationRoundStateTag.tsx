import { RoundState } from "@/api"
import { Box, HStack, Skeleton, TagProps, Text, useColorModeValue } from "@chakra-ui/react"

type Props = {
  state?: keyof typeof RoundState
} & TagProps
export const AllocationRoundStateTag = ({ state, ...props }: Props) => {
  const colorShade = useColorModeValue("600", "300")
  const colorScheme = {
    "0": "primary",
    "1": "red",
    "2": "green",
    "-1": "gray",
  }[state ?? "-1"]

  return (
    <Skeleton isLoaded={!!state}>
      <HStack spacing={1} align={"center"}>
        {state === "0" && <Box w={1.5} h={1.5} bg={`${colorScheme}.${colorShade}`} borderRadius={"full"} />}{" "}
        <Text color={`${colorScheme}.${colorShade}`} fontWeight={"500"} fontSize="medium" {...props}>
          {state ? RoundState[state] : "Unknown"}
        </Text>
      </HStack>
    </Skeleton>
  )
}
