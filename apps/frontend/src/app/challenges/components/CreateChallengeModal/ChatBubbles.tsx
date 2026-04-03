import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { ReactNode } from "react"

export const AssistantBubble = ({ children }: { children: ReactNode }) => (
  <HStack align="start" gap="3" w="full">
    <Box
      boxSize="10"
      flexShrink={0}
      borderRadius="2xl"
      bg="bg.secondary"
      overflow="hidden"
      border="1px solid"
      borderColor="border.secondary">
      <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
    </Box>
    <Box
      bg="bg.secondary"
      borderRadius="2xl"
      px={{ base: "4", md: "5" }}
      py={{ base: "3", md: "4" }}
      border="1px solid"
      borderColor="border.secondary"
      w="full">
      {children}
    </Box>
  </HStack>
)

export const UserBubble = ({ children }: { children: ReactNode }) => (
  <HStack justify="end" w="full">
    <Box
      bg="bg.secondary"
      color="text.default"
      borderRadius="2xl"
      px={{ base: "4", md: "5" }}
      py="3"
      maxW={{ base: "full", md: "85%" }}>
      {children}
    </Box>
  </HStack>
)

export const TypingIndicator = () => (
  <HStack align="start" gap="3" w="full">
    <Box
      boxSize="10"
      flexShrink={0}
      borderRadius="2xl"
      bg="bg.secondary"
      overflow="hidden"
      border="1px solid"
      borderColor="border.secondary">
      <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
    </Box>
    <Box bg="bg.secondary" borderRadius="2xl" px="5" py="4" border="1px solid" borderColor="border.secondary">
      <HStack gap="1.5">
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            boxSize="2"
            borderRadius="full"
            bg="text.subtle"
            style={{
              animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </HStack>
    </Box>
  </HStack>
)

export const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <VStack align="start" gap="1">
    <Text textStyle="xs" color="text.subtle">
      {label}
    </Text>
    <Text textStyle="sm" fontWeight="semibold">
      {value}
    </Text>
  </VStack>
)
