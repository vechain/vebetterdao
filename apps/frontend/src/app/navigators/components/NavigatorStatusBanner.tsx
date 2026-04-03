import { Card, HStack, Text } from "@chakra-ui/react"
import { LuShield, LuUsers } from "react-icons/lu"

type Props = {
  isNavigator?: boolean
  isDelegated?: boolean
}

export const NavigatorStatusBanner = ({ isNavigator, isDelegated }: Props) => {
  if (isNavigator) {
    return (
      <Card.Root variant="outline" borderColor="green.500" bg="green.50" _dark={{ bg: "green.900/20" }}>
        <Card.Body py={3}>
          <HStack gap={3}>
            <LuShield size={20} color="var(--chakra-colors-green-500)" />
            <Text textStyle="sm" fontWeight="semibold">
              {"You are a registered Navigator"}
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>
    )
  }

  if (isDelegated) {
    return (
      <Card.Root variant="outline" borderColor="blue.500" bg="blue.50" _dark={{ bg: "blue.900/20" }}>
        <Card.Body py={3}>
          <HStack gap={3}>
            <LuUsers size={20} color="var(--chakra-colors-blue-500)" />
            <Text textStyle="sm" fontWeight="semibold">
              {"You are delegated to a Navigator"}
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>
    )
  }

  return null
}
