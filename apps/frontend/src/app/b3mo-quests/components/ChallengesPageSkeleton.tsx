import { Box, Card, HStack, SimpleGrid, Skeleton, Stack, VStack, Wrap } from "@chakra-ui/react"

const CompactCardSkeleton = () => (
  <Card.Root
    variant="primary"
    px={{ base: "5", md: "6" }}
    py={{ base: "5", md: "6" }}
    borderRadius="3xl"
    h="full"
    boxShadow="sm">
    <VStack gap={{ base: "5", md: "6" }} align="stretch" h="full">
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

      <SimpleGrid columns={2} gap="3" mt="auto">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} h="24" borderRadius="2xl" />
        ))}
      </SimpleGrid>

      <Wrap gap="2">
        <Skeleton h="6" w="28" borderRadius="full" />
        <Skeleton h="6" w="32" borderRadius="full" />
      </Wrap>
    </VStack>
  </Card.Root>
)

export const ChallengesPageSkeleton = () => (
  <VStack align="stretch" w="full" gap="8">
    {/* Header */}
    <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap="4">
      <Skeleton h={{ base: "8", lg: "10" }} w="32" borderRadius="md" />
      <Skeleton h="10" w="32" borderRadius="full" />
    </Stack>

    {/* Section: active challenges */}
    <VStack align="stretch" gap="4" w="full">
      <Skeleton h="7" w="48" borderRadius="md" />
      <HStack gap="4">
        {[1, 2].map(i => (
          <Box key={i} minW={{ base: "85vw", md: "420px" }}>
            <CompactCardSkeleton />
          </Box>
        ))}
      </HStack>
    </VStack>

    {/* Section: open challenges */}
    <VStack align="stretch" gap="4" w="full">
      <Skeleton h="7" w="36" borderRadius="md" />
      <HStack gap="3">
        {[1, 2].map(i => (
          <Box key={i} minW={{ base: "85vw", md: "420px" }}>
            <CompactCardSkeleton />
          </Box>
        ))}
      </HStack>
    </VStack>
  </VStack>
)
