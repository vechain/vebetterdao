"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { Box, VStack, Text, Heading, Flex, Button, Badge, Icon } from "@chakra-ui/react"
import { FaArrowUp } from "react-icons/fa6"

export const RoundInfoBottomSheet = () => {
  const [isOpen, setIsOpen] = React.useState(true)
  const [activeSnap, setActiveSnap] = React.useState(0.1)

  React.useEffect(() => {
    setIsOpen(true)
  }, [])

  return (
    <Drawer.Root
      modal={false}
      shouldScaleBackground
      open={isOpen}
      onOpenChange={setIsOpen}
      snapPoints={[0.1, 0.5, 0.95]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={snap => setActiveSnap(Number(snap))}
      dismissible={false}>
      <Box
        as={Drawer.Overlay}
        pos={"fixed"}
        inset={0}
        bg={"blackAlpha.400"}
        pointerEvents={activeSnap === 0.1 ? "none" : "auto"}
      />
      <Box
        zIndex={100}
        as={Drawer.Content}
        pos={"fixed"}
        bottom={0}
        left={0}
        right={0}
        bg={"white"}
        roundedTop={"20px"}
        display={"flex"}
        pointerEvents={activeSnap === 0.1 ? "none" : "auto"}>
        <Box
          p={4}
          bg="white"
          borderTopRadius="20px"
          boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
          pointerEvents={"auto"}>
          <Flex justify="center" mb={4}>
            <Box w="40px" h="4px" bg="gray.300" borderRadius="full" />
          </Flex>
          <VStack spacing={4} align="stretch" maxW="md" mx="auto">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="lg">We're on Round #15</Heading>
                <Flex align="center" mt={1}>
                  <Box w={2} h={2} borderRadius="full" bg="red.500" mr={2} />
                  <Text color="gray.500">Active session</Text>
                </Flex>
              </Box>
              <Icon as={FaArrowUp} boxSize={6} color="gray.400" />
            </Flex>
            <Text color="gray.600">July 12th to July 21th</Text>
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
        </Box>
      </Box>
    </Drawer.Root>
  )
}
