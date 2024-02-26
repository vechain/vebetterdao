import { HStack, Text } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { getConfig } from "@repo/config"
import { useEffect, useRef, useState } from "react"

const isTestnetPhase = ["test", "solo", "custom"].includes(getConfig().network.type)
const text = "Alpha Testnet Phase"
const MotionHStack = motion(HStack)
export const AlphaTestnetBanner = () => {
  const textsNumber = 50
  const texts = Array.from({ length: textsNumber }, _ => text)
  const gap = 8

  //Create an ininite horizontal text slider with framer motion

  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth)
    }
  }, [containerRef])

  if (!isTestnetPhase) return null

  return (
    <HStack
      py={[4, 3]}
      ref={containerRef}
      w="full"
      justify="center"
      align="center"
      overflow="hidden"
      position="relative"
      bg="black"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 15%)",
        zIndex: 1,
      }}
      _after={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "linear-gradient(90deg, rgba(0,0,0,0) 85%, rgba(0,0,0,1) 100%)",
        zIndex: 1,
      }}>
      <MotionHStack
        spacing={gap}
        initial={{ x: 0 }}
        animate={{ x: -width - gap }}
        transition={{
          duration: 30,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}>
        {texts.map((text, index) => (
          <Text
            key={index}
            fontSize={["sm", "md"]}
            color="secondary.500"
            whiteSpace="nowrap"
            textTransform={"uppercase"}
            fontWeight={"400"}>
            {text}
          </Text>
        ))}
      </MotionHStack>
    </HStack>
  )
}
