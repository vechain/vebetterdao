import { pulseKeyFrames } from "@/app/theme"
import { Box } from "@chakra-ui/react"

type Props = {
  color?: string
  size?: string | number
  pulse?: boolean
  scaledPulse?: number
}

export const DotSymbol: React.FC<Props> = ({ color = "inherit", size = 1.5, pulse = false, scaledPulse = 1.5 }) => {
  if (!pulse) return <Box w={size} h={size} bg={color} borderRadius={"full"} />

  return (
    <Box pos="relative" boxSize={pulse ? Number(size) * scaledPulse : size}>
      <Box
        boxSize={size}
        bg={color}
        borderRadius="full"
        pos="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
      />
      <Box
        pos="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        borderRadius="full"
        borderWidth={Number(size) / 4}
        borderColor={color}
        w={Number(size) * scaledPulse}
        h={Number(size) * scaledPulse}
        animation={`${pulseKeyFrames} 1.5s infinite`}
      />
    </Box>
  )
}
