import { Box, Text } from "@chakra-ui/react"

export const TimelineItem = ({ title, description }: { title: string; description?: string }) => {
  return (
    <Box flexShrink="0" px={"8px"}>
      <Text>{title}</Text>
      {description && (
        <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
          {description}
        </Text>
      )}
    </Box>
  )
}
