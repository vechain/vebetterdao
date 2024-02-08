import { useProposeAllocationRound } from "@/hooks"
import { Box, Button, HStack, Heading, Text } from "@chakra-ui/react"

export const CreateNewAllocationRound: React.FC = () => {
  const { sendTransaction } = useProposeAllocationRound({})
  return (
    <HStack w="full" justify="space-between">
      <Box>
        <Heading>No active allocation round</Heading>
        <Text>Create a new allocation round to start allocating funds to Dapps</Text>
      </Box>
      <Button onClick={() => sendTransaction(undefined)}>Create new allocation round</Button>
    </HStack>
  )
}
