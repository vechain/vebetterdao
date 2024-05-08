import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { ReactElement } from "react"

type Props = {
  votes: number
  percentage: number
  color: string
  icon: ReactElement
}
export const ProposalVotesProgressBar = ({ votes, percentage, color, icon }: Props) => {
  return (
    <VStack alignItems={"stretch"}>
      <HStack justify={"space-between"}>
        <HStack>
          {icon}
          <Text color={color}>Abstained</Text>
          <Text color={color} fontWeight={600}>
            {votes} V3
          </Text>
        </HStack>
        <Text>{percentage}%</Text>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="8px" rounded="full" />
        <Box bg={color} h="8px" rounded="full" w={`${percentage}%`} position="absolute" top={0} left={0} />
      </Box>
    </VStack>
  )
}
