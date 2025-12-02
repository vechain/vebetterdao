"use client"

import { Bleed, Card, Flex, Heading, HStack, Skeleton, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export function VoteTabSkeleton() {
  const { t } = useTranslation()
  return (
    <VStack gap="4" w="full">
      {/* Mobile */}
      <Skeleton height="10" w="full" hideFrom="md" rounded="lg" />

      <Bleed inlineStart="4" inlineEnd="4">
        <HStack gap="6" alignItems="flex-start">
          <VStack flex={1} gap="4" align="stretch">
            {/* Desktop */}
            <VStack hideBelow="md" gap="4" align="stretch" minWidth="3xl" px="4">
              <Flex alignItems="center" justifyContent="space-between">
                <Heading size="lg">{t("Active apps in current round")}</Heading>
              </Flex>
              <Flex gap="4" alignItems="center" justifyContent="space-between">
                <Skeleton height="10" flex="1" rounded="lg" />
                <Skeleton height="10" width="40" rounded="lg" />
              </Flex>
            </VStack>

            {/* Mobile */}
            <HStack hideFrom="md" gap="2" w="full" overflowX="auto" px="4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} height="8" minWidth="sm" rounded="md" />
              ))}
            </HStack>

            <VStack gap={{ base: "3", md: "4" }} w="full" px="4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={{ base: "18", md: "21" }} w="full" rounded="lg" />
              ))}
            </VStack>
          </VStack>

          {/* Desktop */}
          <VStack hideBelow="md" align="stretch" justifySelf="flex-start">
            <Heading size="lg">{t("Your top 5 Apps")}</Heading>
            <Card.Root variant="primary" p="8">
              <Card.Body gap="8">
                <Skeleton height="4" width="40" rounded="sm" />
                {[...Array(5)].map((_, i) => (
                  <Flex key={i} gap="4" alignItems="center">
                    <Skeleton width="12" height="12" rounded="lg" flexShrink={0} />
                    <Flex flex="1" flexDir="column" alignItems="flex-start" gap="1">
                      <Skeleton height="5" width="80%" rounded="md" />
                      <Skeleton height="4" width="16" rounded="sm" />
                    </Flex>
                    <Flex flexDir="column" alignItems="flex-end" gap="0.5">
                      <Skeleton height="3.5" width="12" rounded="sm" />
                      <Skeleton height="3.5" width="14" rounded="sm" />
                    </Flex>
                  </Flex>
                ))}
              </Card.Body>
            </Card.Root>
          </VStack>
        </HStack>
      </Bleed>
    </VStack>
  )
}
