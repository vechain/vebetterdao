import { Card, CardBody, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { ExclamationTriangle } from "@/components"

type Props = {
  appName?: string
  reason?: string
}
export const SignalCard = ({ appName, reason }: Props) => {
  return (
    <Card variant={"filledSmall"} w="full">
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w="fit-content" h="fit-content" p={2} align="center" justify="center" borderRadius={"full"}>
              <ExclamationTriangle size={"2rem"} />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} fontWeight={600}>
                  {appName}
                </Text>
              </HStack>
              {reason && (
                <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                  {reason}
                </Text>
              )}
            </VStack>
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}
