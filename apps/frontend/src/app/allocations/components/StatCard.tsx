import { Card, Icon, Text, Skeleton, Square, VStack, type CardRootProps } from "@chakra-ui/react"
import { ReactNode } from "react"

interface StatCardProps extends Omit<CardRootProps, "variant"> {
  variant: "info" | "warning" | "positive"
  title: string
  subtitle: string | ReactNode
  showIcon?: boolean
  icon?: ReactNode
  cta?: ReactNode
  isLoading?: boolean
}

export const StatCard = ({
  variant,
  title,
  subtitle,
  isLoading = false,
  showIcon = true,
  icon,
  cta,
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
      gap={{ base: "2", md: "4" }}>
      {showIcon && icon && (
        <Square rounded="md" bg={`status.${variant}.secondary`} aspectRatio={1} height={{ base: "32px", md: "60px" }}>
          <Icon boxSize={{ base: "5", md: "6" }} color={`status.${variant}.strong`}>
            {icon}
          </Icon>
        </Square>
      )}
      <VStack flex={1} lineClamp={2}>
        <Text textStyle={{ base: "xs", md: "md" }} color="text.subtle">
          {title}
        </Text>
        {typeof subtitle === "string" ? (
          <Skeleton loading={isLoading}>
            <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="semibold">
              {subtitle}
            </Text>
          </Skeleton>
        ) : (
          subtitle
        )}
      </VStack>
      {cta && cta}
    </Card.Root>
  )
}
