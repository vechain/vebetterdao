import { Box, HStack, Text, VStack, type BoxProps, type TextProps } from "@chakra-ui/react"
import type { ReactNode } from "react"

type ChallengeStatTileProps = BoxProps & {
  label: ReactNode
  value?: ReactNode
  helper?: ReactNode
  action?: ReactNode
  valueProps?: TextProps
}

export const ChallengeStatTile = ({
  label,
  value,
  helper,
  action,
  valueProps,
  children,
  ...boxProps
}: ChallengeStatTileProps) => {
  return (
    <Box
      bg="bg.secondary"
      borderRadius="2xl"
      border="sm"
      borderColor="border.secondary"
      px={{ base: "4", md: "5" }}
      py="4"
      overflow="hidden"
      {...boxProps}>
      <VStack align="stretch" gap="2" h="full">
        <HStack align="start" justify="space-between" gap="3">
          <Text
            textStyle="xxs"
            color="text.subtle"
            textTransform="uppercase"
            letterSpacing="0.08em"
            fontWeight="semibold"
            flex="1"
            minW="0">
            {label}
          </Text>
          {action && <Box flexShrink={0}>{action}</Box>}
        </HStack>
        {children ?? (
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" lineHeight="1.1" {...valueProps}>
            {value}
          </Text>
        )}
        {helper && <Box mt="auto">{helper}</Box>}
      </VStack>
    </Box>
  )
}
