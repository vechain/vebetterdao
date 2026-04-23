import { Card, Skeleton } from "@chakra-ui/react"

export const ChallengeDetailSkeleton = () => (
  <Card.Root variant="primary" p={{ base: "6", md: "8" }} w="full" borderRadius="3xl" boxShadow="sm">
    <Skeleton h="360px" borderRadius="2xl" />
  </Card.Root>
)
