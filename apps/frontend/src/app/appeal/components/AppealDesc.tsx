import { Text } from "@chakra-ui/react"

export function AppealDesc({ description }: { description: string }) {
  return (
    <Text color="black" fontSize="md" fontWeight={400}>
      {description}
    </Text>
  )
}
