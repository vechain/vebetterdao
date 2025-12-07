"use client"

import { Box, Card, Flex, Grid, Heading, HStack, Icon, Separator, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react"
import { Activity, SmartphoneDevice } from "iconoir-react"
import { useTranslation } from "react-i18next"

export function RoundInfoTabSkeleton() {
  const { t } = useTranslation()
  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      {/* Mobile */}
      <VStack hideFrom="md" alignItems="stretch" gap="2">
        <HStack gap="2">
          <Skeleton height="6" width="20" rounded="md" />
          <Skeleton height="5.5" width="12" rounded="full" />
        </HStack>
        <Skeleton height="5" width="24" rounded="sm" />
      </VStack>

      {/* Desktop */}
      <Card.Root hideBelow="md" p="6" alignItems="center" justifyContent="space-between" flexDirection="row">
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

      <Card.Root
        p="4"
        variant="outline"
        border="sm"
        borderColor="border.secondary"
        flexDirection={{ base: "column", md: "row" }}
        justifyContent={{ base: "unset", md: "space-between" }}
        gap={{ base: "unset", md: "12" }}>
        <SimpleGrid flex={1} columns={3} rowGap="2" columnGap={{ base: "unset", md: "3" }}>
          {/* Desktop */}
          <Flex hideBelow="md" alignItems="center" gridColumn="1 / span 3">
            <HStack gap="2">
              <Skeleton height="5" width="5" rounded="md" />
              <Skeleton height="6" width="20" rounded="md" />
            </HStack>
          </Flex>
          {[...Array(3)].map((_, i) => (
            <Card.Root
              key={i}
              p={{ base: "0", md: "4" }}
              bg={{ base: "transparent", md: "card.subtle" }}
              gap="1"
              mx={{ base: "auto", md: "unset" }}>
              <HStack gap="2">
                <Skeleton height={{ base: "4", md: "5" }} width={{ base: "4", md: "5" }} rounded="sm" />
                <Skeleton height={{ base: "4", md: "5" }} width={{ base: "14", md: "20" }} rounded="sm" />
              </HStack>
              <Skeleton height="5" width="10" rounded="md" />
            </Card.Root>
          ))}
        </SimpleGrid>

        <Separator hideFrom="md" my="5" borderColor="border.secondary" />

        <VStack flex={1} alignItems="stretch" gap="3">
          <HStack justifyContent="space-between" w="full">
            <HStack gap="2">
              <Skeleton height={{ base: "4", md: "5" }} width={{ base: "4", md: "5" }} rounded="sm" />
              <Skeleton height={{ base: "4", md: "6" }} width={{ base: "36", md: "44" }} rounded="md" />
            </HStack>
            {/* Mobile */}
            <Skeleton hideFrom="md" height="4" width="4" rounded="sm" />
            {/* Desktop */}
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

      {/* Mobile */}
      <VStack hideFrom="md" gap="3" alignItems="stretch">
        <HStack justifyContent="space-between" w="full">
          <Heading size="lg" fontWeight="semibold">
            {t("Explore rounds history")}
          </Heading>
          <Skeleton height="4" width="4" rounded="sm" />
        </HStack>
        {[...Array(3)].map((_, i) => (
          <Card.Root key={i} p="4">
            <HStack justifyContent="space-between">
              <VStack alignItems="flex-start" gap="1">
                <Skeleton height="5" width="20" rounded="md" />
                <Skeleton height="4" width="24" rounded="sm" />
              </VStack>
              <VStack alignItems="flex-end" gap="1">
                <Skeleton height="5" width="14" rounded="md" />
                <Skeleton height="4" width="10" rounded="sm" />
              </VStack>
            </HStack>
          </Card.Root>
        ))}
      </VStack>

      {/* Desktop */}
      <Grid hideBelow="md" gridTemplateColumns="repeat(2,1fr)" gap="6">
        <Card.Root p="6" minHeight="xl">
          <HStack gap="2" pb="6">
            <Icon as={Activity} boxSize="5" color="icon.default" />
            <Heading size="lg" fontWeight="semibold">
              {t("Your voting activity")}
            </Heading>
          </HStack>
          <Grid gridTemplateColumns="repeat(2,1fr)" rowGap="8" columnGap="3">
            {[...Array(2)].map((_, i) => (
              <Card.Root key={i} p="4" bg="card.subtle" gap="1">
                <Skeleton height="5" width="28" rounded="sm" />
                <Skeleton height="7" width="20" rounded="md" />
              </Card.Root>
            ))}
            <VStack gridColumn="1 / 3" align="stretch" gap="3">
              <HStack justifyContent="space-between">
                <Skeleton height="4.5" width="16" rounded="sm" />
                <Skeleton height="4.5" width="12" rounded="full" />
              </HStack>
              {[...Array(3)].map((_, i) => (
                <Card.Root key={i} p="4" bg="card.subtle">
                  <Grid gridTemplateColumns="auto 1fr auto" gap="4" alignItems="center">
                    <Skeleton width="11" height="11" rounded="lg" />
                    <VStack gap="1" align="start">
                      <Skeleton height="4.5" width="80%" rounded="md" />
                      <Skeleton height="3.5" width="14" rounded="sm" />
                    </VStack>
                    <Skeleton height="4.5" width="12" rounded="md" />
                  </Grid>
                </Card.Root>
              ))}
            </VStack>
          </Grid>
        </Card.Root>

        <Card.Root p="6" gap="6">
          <VStack gap="6" align="stretch">
            <HStack justifyContent="space-between">
              <HStack gap="2">
                <Icon as={SmartphoneDevice} boxSize="5" color="icon.default" />
                <Heading size="lg" fontWeight="semibold">
                  {t("Active apps")}
                </Heading>
              </HStack>
              <Skeleton height="4.5" width="12" rounded="full" />
            </HStack>
            <Skeleton height="12" w="full" rounded="lg" />
          </VStack>
          <VStack gap="2" align="stretch">
            {[...Array(4)].map((_, i) => (
              <Card.Root
                key={i}
                p="3"
                display="grid"
                gridTemplateColumns="auto 1fr auto"
                alignItems="center"
                columnGap="4">
                <Skeleton width="11" height="11" rounded="lg" />
                <VStack gap="1" alignItems="start">
                  <Skeleton height="5.5" width="70%" rounded="md" />
                  <Skeleton height="4" width="36" rounded="sm" />
                </VStack>
                <Skeleton width="5" height="5" rounded="sm" />
              </Card.Root>
            ))}
          </VStack>
        </Card.Root>
      </Grid>
    </VStack>
  )
}
