/**
 * MulticolorBar - A generic progress bar component that supports multiple colored segments
 *
 * Usage examples:
 *
 * // Single segment
 * <MulticolorBar
 *   segments={[{ percentage: 65, color: "blue.500", label: "Progress" }]}
 * />
 *
 * // Multiple segments
 * <MulticolorBar
 *   segments={[
 *     { percentage: 30, color: "green.500", label: "Completed" },
 *     { percentage: 25, color: "yellow.500", label: "In Progress" },
 *     { percentage: 15, color: "red.500", label: "Failed" }
 *   ]}
 *   height={4}
 *   showMarker={true}
 *   markerPosition={75}
 * />
 */

import React from "react"
import { Box } from "@chakra-ui/react"

interface MulticolorBarSegment {
  percentage: number
  color: string
  label?: string
}

interface MulticolorBarProps {
  segments: MulticolorBarSegment[]
  height?: string | number
  backgroundColor?: string
  borderRadius?: string
  showMarker?: boolean
  markerPosition?: number
  markerColor?: string
  className?: string
}

export const MulticolorBar: React.FC<MulticolorBarProps> = ({
  segments,
  height = 2,
  backgroundColor = "gray.200",
  borderRadius = "xl",
  showMarker = false,
  markerPosition = 0,
  markerColor = "gray.400",
  className,
}) => {
  // Ensure total percentage doesn't exceed 100%
  const totalPercentage = segments.reduce((sum, segment) => sum + segment.percentage, 0)
  const normalizedSegments =
    totalPercentage > 100
      ? segments.map(segment => ({
          ...segment,
          percentage: (segment.percentage / totalPercentage) * 100,
        }))
      : segments

  let currentPosition = 0

  return (
    <Box
      w="full"
      h={height}
      bg={backgroundColor}
      borderRadius={borderRadius}
      pos="relative"
      overflow="hidden"
      className={className}>
      {normalizedSegments.map((segment, index) => {
        const segmentElement = (
          <Box
            key={`${segment.color}-${segment.percentage}-${currentPosition}`}
            pos="absolute"
            left={`${currentPosition}%`}
            w={`${segment.percentage}%`}
            h="full"
            bg={segment.color}
            borderRadius={
              index === 0 && index === normalizedSegments.length - 1
                ? borderRadius
                : index === 0
                  ? `${borderRadius} 0 0 ${borderRadius}`
                  : index === normalizedSegments.length - 1
                    ? `0 ${borderRadius} ${borderRadius} 0`
                    : "none"
            }
            title={segment.label}
          />
        )
        currentPosition += segment.percentage
        return segmentElement
      })}

      {showMarker && (
        <Box
          pos="absolute"
          left={`${Math.min(Math.max(markerPosition, 0), 100)}%`}
          top={0}
          h="full"
          w="1px"
          bg={markerColor}
          zIndex={1}
        />
      )}
    </Box>
  )
}
