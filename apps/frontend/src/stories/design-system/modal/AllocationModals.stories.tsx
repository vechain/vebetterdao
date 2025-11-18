import {
  Box,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  Badge,
  Button,
  Text,
  Progress,
  Float,
  Circle,
  Icon,
  Avatar,
  Separator,
} from "@chakra-ui/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Check, Flash } from "iconoir-react"
import { useState } from "react"

import { AutoVoteModal } from "@/app/allocations/components/AutoVoteModal"
import { BaseModal } from "@/components/BaseModal"
import { Modal } from "@/components/Modal"
import { SuccessModalContent } from "@/components/TransactionModal/SuccessModalContent/SuccessModalContent"

const meta: Meta<typeof Modal> = {
  title: "design-system/components/Modal/Allocation Modals",
  component: Modal,
}

export default meta
type Story = StoryObj<typeof Modal>

export const AutomationToggleMobileLight: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    return (
      <AutoVoteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onApply={() => {
          setIsOpen(false)
        }}
        defaultEnabled={true}
      />
    )
  },
}

export const VPSummaryMobileLight: Story = {
  render: () => {
    return (
      <Modal
        isOpen
        onClose={() => {}}
        title="Confirm your vote"
        showCloseButton
        modalContentProps={{ maxWidth: "400px" }}
        footer={
          <SimpleGrid columns={2} gap={3} w="full">
            <Button variant="secondary" onClick={() => {}}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {}}>
              Vote
            </Button>
          </SimpleGrid>
        }>
        <VStack gap={4} align="stretch">
          <Card.Root variant="outline" p={4} border="sm" borderColor="border.secondary">
            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                <Text fontSize="xl">⚡</Text>
                <Text textStyle="md" fontWeight="semibold">
                  Voting Power
                </Text>
              </HStack>
              <Text textStyle="lg" fontWeight="bold">
                12,345,678.90
              </Text>
            </HStack>

            <Separator color="border.secondary" my="4" />

            <Button variant="link" size="md">
              Customize allocation
            </Button>
          </Card.Root>

          <VStack gap={2} align="stretch">
            <HStack justify="space-between">
              <Text textStyle="sm" fontWeight="semibold">
                Selected apps
              </Text>
              <Badge variant="neutral" size="sm" rounded="sm">
                10 apps
              </Badge>
            </HStack>

            <Card.Root
              variant="outline"
              p={4}
              border="sm"
              borderColor="border.secondary"
              display="flex"
              justifyContent="space-evenly"
              gap="4"
              flexDirection="row"
              overflowX="auto">
              {Array(10)
                .fill(null)
                .map(i => (
                  <Box key={i} display="inline-block" pos="relative">
                    <Avatar.Root size="lg" shape="rounded">
                      <Avatar.Image
                        src={`https://api.gateway-proxy.vechain.org/ipfs/bafybeibesc5yitq44iopqnuadcys4vvomv57yf53efgw5wv7xv6qyi5wcm/media/logo.png`}
                      />
                      <Avatar.Fallback />
                    </Avatar.Root>
                    <Float placement="top-end">
                      <Circle background="status.positive.primary" border="sm" borderColor="status.positive.subtle">
                        <Icon as={Check} color="white" />
                      </Circle>
                    </Float>
                  </Box>
                ))}
            </Card.Root>
          </VStack>
        </VStack>
      </Modal>
    )
  },
}

export const VoteProcessingMobileLight: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)
    const [isSuccess, _] = useState(true)

    return (
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isSuccess ? "Vote successfully submitted!" : "Sending transaction..."}
        illustration="/assets/icons/2d-illustrations/airdrop.svg"
        showHeader
        showCloseButton
        isCloseable
        modalContentProps={{ maxWidth: "400px" }}
        footer={
          <Button flex={1} variant="primary">
            Go back to Allocation
          </Button>
        }>
        <Card.Root
          variant="subtle"
          mt="8"
          p={4}
          bg="bg.secondary"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap="2">
          <Text textStyle="sm" color="text.subtle">
            You voted with
          </Text>
          <Badge
            variant="outline"
            rounded="md"
            size="lg"
            borderWidth="2px"
            borderColor="status.positive.primary"
            color="status.positive.primary"
            px={3}
            py={1}
            textStyle="md">
            <Icon as={Flash} color="status.positive.primary" boxSize="5" />
            125,890
          </Badge>
        </Card.Root>
      </Modal>
    )
  },
}

export const TransactionSuccessModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    // Mock voting weight description (matching the real implementation)
    const votingWeightDescription = (
      <Card.Root
        variant="subtle"
        mt="8"
        p={4}
        bg="bg.secondary"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap="2">
        <Text textStyle="sm" color="text.subtle">
          You voted with
        </Text>
        <Badge
          variant="outline"
          rounded="md"
          size="lg"
          borderWidth="2px"
          borderColor="status.positive.primary"
          color="status.positive.primary"
          px={3}
          py={1}
          textStyle="md">
          <Icon as={Flash} color="status.positive.primary" boxSize="5" />
          125,890
        </Badge>
      </Card.Root>
    )

    const customButton = (
      <Button
        variant="primary"
        alignSelf="center"
        px={8}
        py={2.5}
        textStyle="lg"
        fontWeight="semibold"
        onClick={() => setIsOpen(false)}>
        Back to Home
      </Button>
    )

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showCloseButton
        isCloseable
        modalContentProps={{ maxWidth: "400px" }}
        modalBodyProps={{ p: 6 }}>
        <SuccessModalContent
          title="Vote successfully submitted!"
          description={votingWeightDescription}
          customButton={customButton}
          txId="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
          showSocialButtons={false}
          showTransactionDetailsButton={false}
          onClose={() => setIsOpen(false)}
        />
      </BaseModal>
    )
  },
}

export const AllocationDetailsMobileLight: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    return (
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Total rewards distributed" showCloseButton>
        <VStack gap={4} align="stretch">
          <HStack justify="center" gap={2}>
            <Text fontSize="2xl" fontWeight="bold">
              B3TR
            </Text>
            <Text textStyle="xl" fontWeight="bold">
              2.45 M
            </Text>
          </HStack>

          <Progress.Root size="sm" value={100}>
            <Progress.Track>
              <Progress.Range
                css={{
                  background:
                    "linear-gradient(to right, #10B981 0%, #10B981 33%, #3B82F6 33%, #3B82F6 66%, #F59E0B 66%, #F59E0B 100%)",
                }}
              />
            </Progress.Track>
          </Progress.Root>

          <Card.Root variant="outline" p={4}>
            <VStack gap={2} align="stretch" fontSize="sm">
              <SimpleGrid columns={3} gap={2} fontWeight="semibold" borderBottomWidth="1px" pb={2}>
                <Text textStyle="xs" color="gray.600">
                  To
                </Text>
                <Text textStyle="xs" color="gray.600" textAlign="right">
                  Amount
                </Text>
                <Text textStyle="xs" color="gray.600" textAlign="right">
                  Rewards
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2}>
                <HStack gap={2}>
                  <Box w="2" h="2" bg="green.500" borderRadius="full" />
                  <Text textStyle="sm">Apps</Text>
                </HStack>
                <Text textStyle="sm" textAlign="right">
                  45
                </Text>
                <Text textStyle="sm" textAlign="right" fontWeight="semibold">
                  820,500
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2}>
                <HStack gap={2}>
                  <Box w="2" h="2" bg="blue.500" borderRadius="full" />
                  <Text textStyle="sm">Voters</Text>
                </HStack>
                <Text textStyle="sm" textAlign="right">
                  12
                </Text>
                <Text textStyle="sm" textAlign="right" fontWeight="semibold">
                  1,230,000
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2}>
                <Text textStyle="sm" pl={6}>
                  Voting rewards
                </Text>
                <Text textStyle="sm" textAlign="right">
                  —
                </Text>
                <Text textStyle="sm" textAlign="right" fontWeight="semibold">
                  615,000
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2}>
                <Text textStyle="sm" pl={6}>
                  GM NFT Multiplier
                </Text>
                <Text textStyle="sm" textAlign="right">
                  —
                </Text>
                <Text textStyle="sm" textAlign="right" fontWeight="semibold">
                  615,000
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2}>
                <HStack gap={2}>
                  <Box w="2" h="2" bg="orange.500" borderRadius="full" />
                  <Text textStyle="sm">VeBetter treasury</Text>
                </HStack>
                <Text textStyle="sm" textAlign="right">
                  43
                </Text>
                <Text textStyle="sm" textAlign="right" fontWeight="semibold">
                  399,500
                </Text>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={2} borderTopWidth="1px" pt={2} fontWeight="bold">
                <Text textStyle="sm">Total</Text>
                <Text textStyle="sm" textAlign="right">
                  100
                </Text>
                <Text textStyle="sm" textAlign="right">
                  2,450,000
                </Text>
              </SimpleGrid>
            </VStack>
          </Card.Root>
        </VStack>
      </Modal>
    )
  },
}

export const VoteErrorMobileLight: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)

    return (
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Sorry, you couldn't vote"
        illustration="/assets/icons/2d-illustrations/alert.svg"
        showCloseButton
        footer={
          <Button variant="primary" w="full" onClick={() => setIsOpen(false)}>
            Go back to Allocation
          </Button>
        }>
        <Text mt="4" textStyle="sm" color="text.default" textAlign="center">
          Placeholder text, where we MUST communicate the problem why user couldn’t vote
        </Text>
      </Modal>
    )
  },
}
