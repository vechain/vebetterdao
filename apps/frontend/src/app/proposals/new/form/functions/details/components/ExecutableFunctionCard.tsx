import { Box, Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { abi } from "thor-devkit"
import { ProposalFormStoreState } from "@/store/useProposalFormStore"

type Props = {
  action: ProposalFormStoreState["actions"][0]
  index: number
}

export const ExecutableFunctionCard: React.FC<Props> = ({ action, index }) => {
  return (
    <Card w="full" variant="filled">
      <CardBody py={4}>
        <VStack spacing={4} align="flex-start">
          <HStack justify="space-between" w="full">
            <HStack spacing={4}>
              <Box p={4} bg="gray.100" borderRadius="50%" lineHeight={0}>
                {index + 1}
              </Box>
              <VStack align="flex-start">
                <Heading size="md">{action.functionName}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {action.functionDescription}
                </Text>
              </VStack>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
