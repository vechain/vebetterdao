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
      {segments.map(segment => (
        <>
          <HStack key={`${proposalId}-${segment.color}`} {...segmentProps}>
            <Icon as={segment.icon} boxSize={5} color={segment.color} />
            <Text textStyle="md" color="text.subtle">
              {`${Math.floor(segment.percentage)}%`}
            </Text>
          </HStack>
        </>
      ))}
      {helperText && (
        <Text textStyle="md" color="text.subtle">
          {helperText}
        </Text>
      )}
    </HStack>
  )
}
