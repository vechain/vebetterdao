import { EmptyState, VStack, Button, ButtonProps } from "@chakra-ui/react"
import { ReactNode } from "react"

interface EmptyStateRootProps {
  /** The icon to display in the empty state indicator */
  icon: ReactNode
  /** The main title text */
  title: string
  /** The description text */
  description: string
  /** Optional action button configuration */
  action?: {
    label: string
    onClick: () => void
  } & Omit<ButtonProps, "children" | "onClick">
}

interface EmptyStateCardProps extends EmptyStateRootProps {
  /** EmptyState.Root props - size, py, and all other Chakra props */
  rootProps?: React.ComponentProps<typeof EmptyState.Root>
  /** EmptyState.Content props */
  contentProps?: React.ComponentProps<typeof EmptyState.Content>
  /** EmptyState.Indicator props */
  indicatorProps?: React.ComponentProps<typeof EmptyState.Indicator>
  /** VStack props for the content wrapper */
  stackProps?: React.ComponentProps<typeof VStack>
  /** EmptyState.Title props */
  titleProps?: React.ComponentProps<typeof EmptyState.Title>
  /** EmptyState.Description props */
  descriptionProps?: React.ComponentProps<typeof EmptyState.Description>
}

export const EmptyStateCard = ({
  icon,
  title,
  description,
  action,
  rootProps = {},
  contentProps = {},
  indicatorProps = {},
  stackProps = {},
  titleProps = {},
  descriptionProps = {},
}: EmptyStateCardProps) => {
  const { label, onClick, ...buttonProps } = action || {}

  return (
    <EmptyState.Root size="lg" py={16} {...rootProps}>
      <EmptyState.Content {...contentProps}>
        <EmptyState.Indicator {...indicatorProps}>{icon}</EmptyState.Indicator>
        <VStack textAlign="center" {...stackProps}>
          <EmptyState.Title {...titleProps}>{title}</EmptyState.Title>
          <EmptyState.Description {...descriptionProps}>{description}</EmptyState.Description>
          {action && (
            <Button variant="outline" size="sm" mt={4} {...buttonProps} onClick={onClick}>
              {label}
            </Button>
          )}
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}
