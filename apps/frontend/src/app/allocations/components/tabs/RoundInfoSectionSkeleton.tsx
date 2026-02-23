"use client"

import { Box, Card, Flex, Grid, HStack, Separator, SimpleGrid, Skeleton, VStack, GridItem } from "@chakra-ui/react"

export function RoundInfoSectionSkeleton() {
  return (
    <VStack w="full" gap="2">
      {/* Mobile header */}
      <VStack hideFrom="md" alignItems="stretch" gap="2" w="full">
        <HStack gap="2">
          <Skeleton height="6" width="20" rounded="md" />
          <Skeleton height="5.5" width="12" rounded="full" />
        </HStack>
        <Skeleton height="5" width="24" rounded="sm" />
      </VStack>

      {/* Desktop header */}
      <Card.Root hideBelow="md" p="6" alignItems="center" justifyContent="space-between" flexDirection="row" w="full">
        <Grid gridTemplateColumns="repeat(3,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
          <VStack gap="1" align="start">
            <Skeleton height="5" width="12" rounded="sm" />
            <Skeleton height="12" width="10" rounded="md" />
          </VStack>
          <VStack gap="1" pl="6" align="start">
            <Skeleton height="5" width="20" rounded="sm" />
            <Skeleton height="7" width="32" rounded="md" />
          </VStack>
          <Flex h="full" pl="6" alignItems="flex-start">
            <Skeleton height="5.5" width="12" rounded="full" />
          </Flex>
        </Grid>
        <Flex columnGap="4">
          <Skeleton width="11" height="11" rounded="lg" />
          <Skeleton width="11" height="11" rounded="lg" />
          <Skeleton width="32" height="11" rounded="lg" />
        </Flex>
      </Card.Root>

      {/* Distribution card */}
      <Card.Root
        p="4"
        w="full"
        variant="outline"
        border="sm"
        borderColor="border.secondary"
        flexDirection={{ base: "column", md: "row" }}
        justifyContent={{ base: "unset", md: "space-between" }}
        gap={{ base: "unset", md: "12" }}>
        <SimpleGrid flex={1} columns={3} rowGap="2" columnGap={{ base: "unset", md: "3" }}>
          <GridItem hideBelow="md" display="flex" alignItems="center" gridColumn="1 / span 3">
            <HStack gap="2">
              <Skeleton height="5" width="5" rounded="md" />
              <Skeleton height="6" width="20" rounded="md" />
            </HStack>
          </GridItem>
          {["left", "center", "right"].map(position => (
            <GridItem key={position}>
              <Card.Root
                p={{ base: "0", md: "4" }}
                bg={{ base: "transparent", md: "card.subtle" }}
                gap="1"
                border="none"
                mx={{ base: "auto", md: "unset" }}>
                <HStack gap="2">
                  <Skeleton height={{ base: "4", md: "5" }} width={{ base: "4", md: "5" }} rounded="sm" />
                  <Skeleton height={{ base: "4", md: "5" }} width={{ base: "14", md: "20" }} rounded="sm" />
                </HStack>
                <Skeleton height="5" width="10" rounded="md" />
              </Card.Root>
            </GridItem>
          ))}
        </SimpleGrid>

        <Separator hideFrom="md" my="5" borderColor="border.secondary" />

        <VStack flex={1} alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" w="full">
            <HStack gap="2">
              <Skeleton height={{ base: "4", md: "5" }} width={{ base: "4", md: "5" }} rounded="sm" />
              <Skeleton height={{ base: "4", md: "6" }} width={{ base: "36", md: "44" }} rounded="md" />
            </HStack>
            <Skeleton hideFrom="md" height="4" width="4" rounded="sm" />
            <Skeleton hideBelow="md" height="5" width="12" rounded="sm" />
          </HStack>
          <HStack gap="2">
            <Skeleton boxSize={{ base: "5", md: "6" }} rounded="full" />
            <Skeleton height={{ base: "5", md: "7" }} width="28" rounded="md" />
          </HStack>
          <VStack alignItems="stretch" gap="1">
            <Skeleton height={{ base: "1.5", md: "2" }} w="full" rounded="full" />
            <HStack gap="8" pt="1">
              {["To apps", "To voters", "To treasury"].map((label, i) => (
                <HStack
                  key={label}
                  gap="1"
                  flex={i < 2 ? 1 : undefined}
                  borderRight={i < 2 ? "1px" : undefined}
                  borderColor="border.secondary"
                  pr={i < 2 ? "5" : undefined}>
                  <Box
                    boxSize="1.5"
                    bg={i === 0 ? "status.positive.primary" : i === 1 ? "status.info.strong" : "status.warning.primary"}
                    rounded="full"
                  />
                  <Skeleton height={{ base: "3", md: "3.5" }} width="12" rounded="sm" />
                </HStack>
              ))}
            </HStack>
          </VStack>
        </VStack>
      </Card.Root>
    </VStack>
  )
}
