import { Card, HStack, Separator, Skeleton, VStack } from "@chakra-ui/react"

export const NavigatorCardSkeleton = () => (
  <Card.Root variant="outline" w="full" borderRadius="xl">
    <Card.Body>
      <VStack gap={3} align="stretch" justify="space-between" h="full">
        <VStack gap={6} align="stretch">
          <HStack justify="space-between" align="start">
            <HStack gap={2}>
              <Skeleton boxSize={10} rounded="full" />
              <VStack gap={1} align="start">
                <Skeleton height="4" width="24" rounded="md" />
                <Skeleton height="3" width="14" rounded="sm" />
              </VStack>
            </HStack>
          </HStack>
          <VStack gap={1} align="stretch">
            <Skeleton height="3" width="full" rounded="sm" />
            <Skeleton height="3" width="60%" rounded="sm" />
          </VStack>
        </VStack>

        <VStack gap={3} align="stretch">
          <HStack gap={3}>
            <HStack gap={1}>
              <Skeleton boxSize={5} rounded="full" />
              <Skeleton height="3" width="16" rounded="sm" />
            </HStack>
            <Separator orientation="vertical" height="50%" />
            <HStack gap={1}>
              <Skeleton boxSize={5} rounded="full" />
              <Skeleton height="3" width="16" rounded="sm" />
            </HStack>
          </HStack>
          <Skeleton height="3" width="40" rounded="sm" />
        </VStack>
      </VStack>
    </Card.Body>
  </Card.Root>
)
