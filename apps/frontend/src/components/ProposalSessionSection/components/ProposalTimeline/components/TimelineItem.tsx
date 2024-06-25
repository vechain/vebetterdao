import { Box, Text } from "@chakra-ui/react"
import { ReactNode } from "react"

export const TimelineItem = ({
  title,
  description,
  actionButton = null,
}: {
  title: string
  description?: string
  actionButton?: ReactNode
}) => {
  return (
    <Box flexShrink="0" px={"8px"}>
      <Text>{title}</Text>
      {description && (
        <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
          {description}
        </Text>
      )}
      {actionButton}
    </Box>
  )
}
