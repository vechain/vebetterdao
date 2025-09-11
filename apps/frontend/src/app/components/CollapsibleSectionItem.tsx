import { Text, VStack } from "@chakra-ui/react"

export const CollapsibleSectionItem = ({ title, value }: { title: string; value: string }) => {
  if (!value) return null
  return (
    <VStack align="flex-start" w="full">
      <Text fontWeight="semibold">{title}</Text>
      <Text>{value}</Text>
    </VStack>
  )
}
