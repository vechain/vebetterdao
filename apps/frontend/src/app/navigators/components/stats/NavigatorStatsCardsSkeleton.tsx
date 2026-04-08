import { Card, Flex, HStack, SimpleGrid, Skeleton } from "@chakra-ui/react"

export const NavigatorStatsCardsSkeleton = () => (
  <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} w="full">
    {[1, 2, 3, 4].map(i => (
      <Card.Root key={i} variant="outline" p={{ base: 2, md: 4 }}>
        <Card.Body flex={1}>
          <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
            <Skeleton height={{ base: "3", md: "4" }} width="16" rounded="sm" mb={2} />
            <HStack gap={{ base: 2, md: 3 }}>
              <Skeleton w={{ base: "7", md: "10" }} h={{ base: "7", md: "10" }} rounded="full" flexShrink={0} />
              <Skeleton height={{ base: "5", md: "6" }} width="20" rounded="md" />
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>
    ))}
  </SimpleGrid>
)
