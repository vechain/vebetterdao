import { Image } from "@chakra-ui/react"
import { motion } from "framer-motion"

type Props = {
  size: string | number
  left?: string | number
  top?: string | number
  right?: string | number
  bottom?: string | number
  scaleMin?: number // Minimum scale factor
  scaleMax?: number // Maximum scale factor
  duration?: number // Duration of one complete cycle of the animation
  moveAmplitudeX?: number // Amplitude of the movement along the axes
  moveAmplitudeY?: number // Amplitude of the movement along the axes
}

export const AnimatedStar = ({
  size,
  left,
  top,
  right,
  bottom,
  scaleMin = 1, // Default to no scaling if not specified
  scaleMax = 1.5, // Default to 1.5 times scaling if not specified
  duration = 4, // Default duration of 4 seconds
  moveAmplitudeX = 25, // Default movement amplitude of 25 pixels
  moveAmplitudeY = 25, // Default movement amplitude of 25 pixels
}: Props) => {
  return (
    <motion.div
      initial={{ scale: scaleMin, rotate: 0, x: 0, y: 0 }}
      animate={{
        scale: [scaleMin, scaleMax, scaleMin],
        rotate: [0, 360],
        x: [0, moveAmplitudeX, -moveAmplitudeX, moveAmplitudeX, 0],
        y: [0, moveAmplitudeY, -moveAmplitudeY, moveAmplitudeY, 0],
        transition: {
          duration: duration,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
        },
      }}
      style={{
        width: size,
        height: size,
        position: "absolute",
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Image src="/images/nft-star.svg" alt="Animated star" />
    </motion.div>
  )
}
