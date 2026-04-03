import { Card, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { LuExternalLink, LuShield } from "react-icons/lu"

import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"

export const NavigatorsSidebar = () => {
  const { data: minStake } = useGetMinStake()

  return (
    <VStack gap={4} align="stretch" w="full">
      <Card.Root variant="outline" borderRadius="xl">
        <Card.Body>
          <VStack gap={3} align="start">
            <HStack gap={2}>
              <LuShield size={18} />
              <Heading size="sm">{"What are Navigators?"}</Heading>
            </HStack>
            <Text textStyle="sm" color="fg.muted">
              {
                "Navigators are professional voting delegates who stake B3TR to vote on behalf of citizens in allocation rounds and governance proposals. Citizens can delegate their VOT3 to a navigator and earn rewards without voting themselves."
              }
            </Text>
            <HStack gap={1} cursor="pointer" _hover={{ textDecoration: "underline" }}>
              <Text textStyle="sm" fontWeight="semibold">
                {"Learn more"}
              </Text>
              <LuExternalLink size={14} />
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

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
    </VStack>
  )
}
