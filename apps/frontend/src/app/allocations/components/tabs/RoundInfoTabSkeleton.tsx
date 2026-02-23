"use client"

import { Card, Grid, Heading, HStack, Icon, Skeleton, VStack } from "@chakra-ui/react"
import { Activity, SmartphoneDevice } from "iconoir-react"
import { useTranslation } from "react-i18next"

export function RoundInfoTabSkeleton() {
  const { t } = useTranslation()
  return (
    <VStack alignItems="stretch" gap="5" w="full" mt="2">
      {/* Mobile */}
      <VStack hideFrom="md" gap="3" alignItems="stretch">
        <HStack justifyContent="space-between" w="full">
          <Heading size="lg" fontWeight="semibold">
            {t("Explore rounds history")}
          </Heading>
          <Skeleton height="4" width="4" rounded="sm" />
        </HStack>
        {["first", "second", "third"].map(id => (
          <Card.Root key={id} p="4">
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
            {["left", "right"].map(id => (
              <Card.Root key={id} p="4" bg="card.subtle" gap="1">
                <Skeleton height="5" width="28" rounded="sm" />
                <Skeleton height="7" width="20" rounded="md" />
              </Card.Root>
            ))}
            <VStack gridColumn="1 / 3" align="stretch" gap="3">
              <HStack justifyContent="space-between">
                <Skeleton height="4.5" width="16" rounded="sm" />
                <Skeleton height="4.5" width="12" rounded="full" />
              </HStack>
              {["app-1", "app-2", "app-3"].map(id => (
                <Card.Root key={id} p="4" bg="card.subtle">
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
            {["item-1", "item-2", "item-3", "item-4"].map(id => (
              <Card.Root
                key={id}
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
