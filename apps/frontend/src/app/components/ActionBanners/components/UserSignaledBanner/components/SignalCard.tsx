import { Card, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { ExclamationTriangle } from "@/components"

type Props = {
  appName?: string
  reason?: string
}
export const SignalCard = ({ appName, reason }: Props) => {
  return (
    <Card.Root size="sm" variant={"primary"} w="full">
      <Card.Body>
        <HStack gap={3} w="full" justify="space-between">
          <HStack gap={4}>
            <Flex w="fit-content" h="fit-content" p={2} align="center" justify="center" borderRadius={"full"}>
              <ExclamationTriangle size={"2rem"} />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} fontWeight="semibold">
                  {appName}
                </Text>
              </HStack>
              {reason && (
                <Text textStyle={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                  {reason}
                </Text>
              )}
            </VStack>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
