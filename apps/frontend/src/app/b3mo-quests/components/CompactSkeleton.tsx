import { Card, SimpleGrid, Skeleton, Stack, VStack, Wrap } from "@chakra-ui/react"

export const CompactSkeleton = () => (
  <Card.Root variant="primary" h="full" overflow="hidden">
    <Card.Body>
      <VStack gap="4" align="stretch" h="full">
        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "start" }}
          gap="4">
          <VStack align="stretch" gap="3" flex="1" minW="0">
            <Wrap gap="2">
              <Skeleton h="6" w="14" borderRadius="full" />
              <Skeleton h="6" w="18" borderRadius="full" />
            </Wrap>
            <VStack align="stretch" gap="2">
              <Skeleton h="7" w="68%" borderRadius="md" />
              <Skeleton h="7" w="42%" borderRadius="md" />
            </VStack>
            <Wrap gap="2">
              <Skeleton h="7" w="24" borderRadius="full" />
              <Skeleton h="7" w="22" borderRadius="full" />
              <Skeleton h="7" w="22" borderRadius="full" />
            </Wrap>
          </VStack>
          <Skeleton h="10" w={{ base: "full", md: "28" }} borderRadius="full" />
        </Stack>

        <SimpleGrid columns={2} gap="3" mt="auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h="24" borderRadius="2xl" />
          ))}
        </SimpleGrid>

        <Wrap gap="2">
          <Skeleton h="6" w="28" borderRadius="full" />
          <Skeleton h="6" w="32" borderRadius="full" />
        </Wrap>
      </VStack>
    </Card.Body>
  </Card.Root>
)
