"use client"

import { Box, VStack, Text, Heading, Flex, Button, Badge, useDisclosure, HStack, Skeleton } from "@chakra-ui/react"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { AllocationRoundParticipatingXApps } from "@/components/AllocationRoundsList/components/AllocationRoundParticipatingXApps"
import { useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"

export const RoundInfoBottomSheet = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const { data: allocationRound, isLoading } = useAllocationsRound(currentRoundId)

  return (
    <>
      {!isOpen && (
        <HStack
          w="full"
          justify={"space-between"}
          onClick={onOpen}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="#B1F16C"
          py={5}
          px={4}
          borderTopRadius="20px"
          boxShadow="0px -5px 16px 0px #0000000F"
          cursor="pointer"
          zIndex={3}>
          <Box>
            <Skeleton isLoaded={!!currentRoundId}>
              <Heading fontSize={"20px"} fontWeight={400}>
                We're on <b>Round #{currentRoundId}</b>
              </Heading>
            </Skeleton>
            <Text fontSize={"14px"} fontWeight={400}>
              {allocationRound.voteStartTimestamp?.format("MMM D")} to{" "}
              {allocationRound.voteEndTimestamp?.format("MMM D")}
            </Text>
          </Box>
          {currentRoundId && <AllocationRoundParticipatingXApps roundId={currentRoundId} iconSize={36} />}
        </HStack>
      )}

      <BaseBottomSheet isOpen={isOpen} onClose={onClose} height="70vh">
        <VStack spacing={4} align="stretch" mx="auto">
          <HStack spacing={4} justify="space-between" w="full">
            <Box>
              <Skeleton isLoaded={!!currentRoundId}>
                <Heading fontSize={"20px"} fontWeight={400}>
                  We're on <b>Round #{currentRoundId}</b>
                </Heading>
              </Skeleton>
              <Text fontSize={"14px"} fontWeight={400}>
                {allocationRound.voteStartTimestamp?.format("MMM D")} to{" "}
                {allocationRound.voteEndTimestamp?.format("MMM D")}
              </Text>
            </Box>
            {currentRoundId && <AllocationRoundParticipatingXApps roundId={currentRoundId} iconSize={36} />}
          </HStack>
          <Badge colorScheme="red" alignSelf="flex-start">
            Active session
          </Badge>
          <Heading size="md">Allocations voting</Heading>
          <Text color="gray.600">
            Each week, you can vote for your favorite apps to help distribute resources among them!
          </Text>
          <Box bg="gray.100" p={4} borderRadius="lg">
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="semibold">#15 Allocation round</Text>
              <Text color="blue.600" fontWeight="semibold">
                4.8M
              </Text>
            </Flex>
            <Text color="gray.500" mb={4}>
              total to distribute
            </Text>
            <Flex justify="space-between">
              <Button variant="outline">See more</Button>
              <Button colorScheme="blackAlpha">Vote now</Button>
            </Flex>
          </Box>
          <Heading size="md">Proposals</Heading>
          <Text color="gray.600">Proposals shape the ecosystem. Vote on ideas and build our community together!</Text>
          <Box bg="gray.100" p={4} borderRadius="lg">
            <Text fontWeight="semibold" mb={2}>
              This is a proposal name, a long title about what is the proposal about
            </Text>
            <Text color="gray.500" mb={4}>
              You didn't vote yet
            </Text>
            <Flex justify="flex-end">
              <Button colorScheme="blackAlpha">Vote now</Button>
            </Flex>
          </Box>
        </VStack>
      </BaseBottomSheet>
    </>
  )
}
