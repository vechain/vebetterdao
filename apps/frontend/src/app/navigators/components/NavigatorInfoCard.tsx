import { Card, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { LuExternalLink, LuShield } from "react-icons/lu"

export const NavigatorInfoCard = () => (
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
)
