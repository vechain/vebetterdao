import { HStack, Text, VStack } from "@chakra-ui/react"

interface ResultDetail {
  label: string
  value: string
}

interface ResultsDetailsListProps {
  details: ResultDetail[]
}

export const ResultsDetailsList = ({ details }: ResultsDetailsListProps) => {
  return (
    <VStack align="stretch" gap={4}>
      {details.map(item => (
        <HStack key={item.label} justify="space-between">
          <Text fontSize="md" color="text.subtle">
            {item.label}
          </Text>
          <Text fontSize="md" color="text.subtle">
            {item.value}
          </Text>
        </HStack>
      ))}
    </VStack>
  )
}
