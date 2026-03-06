"use client"

import { Card, Flex, Grid, Heading, HStack, Skeleton, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export function RoundInfoSectionSkeleton() {
  const { t } = useTranslation()
  return (
    <VStack w="full" gap="2">
      <Heading w="full" size={{ base: "xl", md: "3xl" }}>
        {t("Allocation")}
      </Heading>
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
    </VStack>
  )
}
