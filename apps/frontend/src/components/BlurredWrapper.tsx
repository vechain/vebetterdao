import { Heading, VStack, Text } from "@chakra-ui/react"

export const BlurredWrapper = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title?: string
  description?: string
}) => {
  return (
    <VStack gap={4} align="stretch" w="full" h="full" pos="relative">
      <VStack
        pos={"absolute"}
        backdropFilter="blur(10px)"
        borderRadius="xl"
        top={0}
        left={0}
        w={"full"}
        justify={"center"}
        gap={1}
        p={4}
        h="full"
        zIndex={2}
        bg="transparency.100">
        {title && <Heading size="md">{title}</Heading>}
        {description && (
          <Text textStyle="sm" textAlign={"center"}>
            {description}
          </Text>
        )}
      </VStack>
      {children}
    </VStack>
  )
}
