import { HStack, Icon, Text } from "@chakra-ui/react"

type ResultsDisplayProps = {
  proposalId: string
  segments: { percentage: number; color: string; icon: React.ElementType }[]
  helperText?: string
}
export const ResultsDisplay = ({ proposalId, segments, helperText }: ResultsDisplayProps) => {
  const isSingleSegment = segments.length === 1
  const containerProps = {
    justify: "space-between",
    w: "full",
  } as const
  const segmentProps = {
    gap: 2,
    flex: isSingleSegment ? "none" : "1",
    justify: isSingleSegment ? "flex-start" : "center",
  } as const

  return (
    <HStack p={0} {...containerProps}>
      {segments.map(segment => {
        //If less than 1, show 2 decimal places, otherwise show the whole number
        const formattedPercentage =
          segment.percentage > 0 && segment.percentage < 1
            ? segment.percentage.toFixed(2)
            : Math.floor(segment.percentage)

        return (
          <HStack key={`${proposalId}-${segment.color}`} {...segmentProps}>
            <Icon as={segment.icon} boxSize={5} color={segment.color} />
            <Text textStyle="md" color="text.subtle">
              {`${formattedPercentage}%`}
            </Text>
          </HStack>
        )
      })}
      {helperText && (
        <Text textStyle="md" color="text.subtle">
          {helperText}
        </Text>
      )}
    </HStack>
  )
}
