import { Card, Heading, HStack, Text, VStack } from "@chakra-ui/react"

import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"

export const NavigatorDetailsCard = () => {
  const { data: minStake } = useGetMinStake()

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="start">
          <Heading size="sm">{"Details"}</Heading>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Min Stake"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {minStake ? Number(minStake.scaled).toLocaleString() : "-"}
              {" B3TR"}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Navigator Fee"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {"20%"}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Fee Lock Period"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {"4 rounds"}
            </Text>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Capacity Ratio"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {"10:1 (stake:delegation)"}
            </Text>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
