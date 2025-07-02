import { Button, Text } from "@chakra-ui/react"

export const GlassButton = ({
  children,
  onClick,
  rightIcon,
}: {
  children: React.ReactNode
  onClick?: () => void
  rightIcon?: React.ReactElement
}) => (
  <Button
    onClick={onClick}
    display="flex"
    alignItems="center"
    bg="rgba(21, 21, 21, 0.4)"
    backdropFilter="blur(15px)"
    borderRadius="full"
    boxShadow="0px 4px 4px rgba(0, 0, 0, 0.25)"
    border="1px solid rgba(255, 255, 255, 0.1)"
    position="relative"
    color="white"
    _hover={{
      bg: "rgba(40, 40, 45, 0.45)",
      _before: {
        bg: "rgba(60, 60, 65, 0.35)",
      },
    }}
    _before={{
      content: '""',
      position: "absolute",
      inset: "1px",
      bg: "rgba(40, 40, 45, 0.25)",
      borderRadius: "full",
      pointerEvents: "none",
    }}>
    <Text position="relative" zIndex={1} fontWeight="500">
      {children}
    </Text>
    {rightIcon && (
      <Text as="span" position="relative" zIndex={1} ml={2}>
        {rightIcon}
      </Text>
    )}
  </Button>
)
