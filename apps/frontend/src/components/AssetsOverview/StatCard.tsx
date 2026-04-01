import { Card, Icon, Text, Skeleton, Square, VStack, type CardRootProps } from "@chakra-ui/react"
import { NavArrowRight } from "iconoir-react"
import { ReactNode } from "react"

interface StatCardProps extends Omit<CardRootProps, "variant"> {
  variant: "info" | "warning" | "positive" | "neutral"
  title: string
  subtitle: string | ReactNode
  showIcon?: boolean
  hideIconOnMobile?: boolean
  icon?: ReactNode
  cta?: ReactNode
  isLoading?: boolean
  gap?: CardRootProps["gap"]
  onClick?: () => void
}

export const StatCard = ({
  variant,
  title,
  subtitle,
  isLoading = false,
  showIcon = true,
  hideIconOnMobile = false,
  icon,
  cta,
  gap,
  onClick,
}: StatCardProps) => {
  return (
    <Card.Root
      p={{ base: "4", md: "6" }}
      variant="subtle"
      border="sm"
      borderColor="border.secondary"
      bgColor={`status.${variant}.subtle`}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap={{ base: "2", md: "4" }}
      maxBlockSize={{ base: "fit-content", md: "unset" }}
      onClick={onClick}
      cursor={onClick ? "pointer" : undefined}
      _hover={onClick ? { opacity: 0.85 } : undefined}
      transition={onClick ? "opacity 0.15s" : undefined}>
      {showIcon && icon && (
        <Square
          display={hideIconOnMobile ? { base: "none", md: "flex" } : undefined}
          rounded={{ base: "8px", md: "12px" }}
          bg={`status.${variant}.secondary`}
          aspectRatio={1}
          height={{ base: "32px", md: "60px" }}>
          <Icon boxSize={{ base: "5", md: "9" }} color={`status.${variant}.strong`}>
            {icon}
          </Icon>
        </Square>
      )}
      <VStack flex={1} alignItems="start" gap={gap ?? "1"}>
        <Text textStyle={{ base: "sm", md: "md" }} color="text.subtle" lineClamp={1}>
          {title}
        </Text>
        {typeof subtitle === "string" ? (
          <Skeleton loading={isLoading}>
            <Text textStyle={{ base: "xl", md: "2xl" }} fontWeight="semibold">
              {subtitle}
            </Text>
          </Skeleton>
        ) : (
          subtitle
        )}
      </VStack>
      {cta && cta}
      {onClick && (
        <Icon boxSize={{ base: "4", md: "5" }} color="text.subtle" flexShrink={0} alignSelf="center">
          <NavArrowRight />
        </Icon>
      )}
    </Card.Root>
  )
}
