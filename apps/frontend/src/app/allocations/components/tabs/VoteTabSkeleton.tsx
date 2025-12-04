"use client"

import { Card, Flex, Heading, HStack, Skeleton, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export function VoteTabSkeleton() {
  const { t } = useTranslation()
  return (
    <VStack w="full">
      {/* Mobile */}
      <Skeleton height="10" w="full" hideFrom="md" rounded="lg" />
      <Skeleton height="2xl" w="full" hideFrom="md" rounded="lg" />

      {/* Desktop */}
      <HStack hideBelow="md" gap="20" alignItems="stretch">
        <VStack flex={1} minWidth="4xl" align="stretch" gap="4">
          <Heading size="lg">{t("Active apps in current round")}</Heading>
          <Skeleton flex={1} rounded="xl" />
        </VStack>
        <VStack align="stretch">
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

      {/* Mobile */}
      <VStack hideFrom="md" gap="4" align="stretch" px="4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} height="4xl" w="full" rounded="lg" />
        ))}
      </VStack>
    </VStack>
  )
}
