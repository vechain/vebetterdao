import { Text, VStack } from "@chakra-ui/react"

export const CollapsibleSectionItem = ({ title, value }: { title: string; value: string }) => {
  if (!value) return null

  return (
    <VStack align="flex-start" w="full" gap={0}>
      <Text fontWeight="semibold">{title}</Text>
      <Text w="full" whiteSpace="pre-wrap">
        {value}
      </Text>
    </VStack>
  )
}
