import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { ReactNode } from "react"

const AssistantAvatar = () => (
  <Box
    boxSize={{ base: "9", md: "10" }}
    flexShrink={0}
    borderRadius="full"
    bg="bg.primary"
    overflow="hidden"
    border="1px solid"
    borderColor="border.secondary"
    p="1">
    <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
  </Box>
)

const AssistantBubbleShell = ({ children }: { children: ReactNode }) => (
  <HStack align="end" gap="3" w="full">
    <AssistantAvatar />
    <Box
      position="relative"
      bg="bg.primary"
      borderRadius="2xl"
      borderBottomLeftRadius="md"
      px={{ base: "4", md: "5" }}
      py={{ base: "3", md: "4" }}
      border="1px solid"
      borderColor="border.secondary"
      maxW="min(32rem, calc(100% - 3rem))"
      boxShadow="sm"
      _before={{
        content: '""',
        position: "absolute",
        left: "-1.5",
        bottom: "3",
        boxSize: "3",
        bg: "bg.primary",
        borderLeft: "1px solid",
        borderBottom: "1px solid",
        borderColor: "border.secondary",
        transform: "rotate(45deg)",
      }}>
      {children}
    </Box>
  </HStack>
)

export const AssistantBubble = ({ children }: { children: ReactNode }) => (
  <AssistantBubbleShell>{children}</AssistantBubbleShell>
)

export const UserBubble = ({ children }: { children: ReactNode }) => (
  <HStack justify="end" w="full">
    <Box
      position="relative"
      bg="actions.primary.default"
      color="actions.primary.text"
      borderRadius="2xl"
      borderBottomRightRadius="md"
      px={{ base: "4", md: "5" }}
      py="3"
      maxW="min(28rem, 84%)"
      boxShadow="sm"
      _before={{
        content: '""',
        position: "absolute",
        right: "-1.5",
        bottom: "3",
        boxSize: "3",
        bg: "actions.primary.default",
        transform: "rotate(45deg)",
      }}>
      <Box color="inherit" css={{ "& *": { color: "inherit" } }}>
        {children}
      </Box>
    </Box>
  </HStack>
)

export const TypingIndicator = () => (
  <AssistantBubbleShell>
    <Box bg="bg.primary" borderRadius="2xl" px="5" py="4" border="1px solid" borderColor="border.secondary">
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
  </AssistantBubbleShell>
)

export const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <VStack align="start" gap="1">
    <Text textStyle="xs" color="text.subtle">
      {label}
    </Text>
    <Text textStyle="sm" fontWeight="semibold" wordBreak="break-word" overflowWrap="anywhere">
      {value}
    </Text>
  </VStack>
)
