"use client"

import { ButtonGroup, Card, HStack, Skeleton, VStack } from "@chakra-ui/react"

import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

const BreadcrumbItems = [
  { label: "Allocations", href: "/allocations" },
  { label: "History", href: "/allocations/history" },
]

export function HistoryListSkeleton() {
  return (
    <VStack alignItems="stretch" w="full" gap="4">
      <PageBreadcrumb items={BreadcrumbItems} />
      <VStack alignItems="stretch" gap="3" w="full">
        {[...Array(10)].map((_, i) => (
          <Card.Root key={i} p="4" variant="outline" border="sm" borderColor="border.secondary">
            <HStack alignItems="center" justifyContent="space-between" gap="3">
              <VStack gap="2" alignItems="flex-start">
                <Skeleton height="5" width="10" rounded="md" />
                <Skeleton height="4" width="24" rounded="sm" />
              </VStack>
              <VStack gap="1" alignItems="flex-end">
                <HStack gap="2">
                  <Skeleton boxSize="5" rounded="full" />
                  <Skeleton height="5" width="28" rounded="md" />
                </HStack>
                <Skeleton height="3" width="24" rounded="sm" />
              </VStack>
            </HStack>
          </Card.Root>
        ))}
      </VStack>
      <ButtonGroup variant="ghost" size="xs" mx={{ base: "auto", md: "unset" }}>
        <Skeleton height="8" width="8" rounded="md" />
        <Skeleton height="5" width="14" rounded="sm" />
        <Skeleton height="8" width="8" rounded="md" />
      </ButtonGroup>
    </VStack>
  )
}
