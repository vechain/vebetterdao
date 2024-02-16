import { useColorModeValue, useToken } from "@chakra-ui/react"

export const useTokenColors = () => {
  const [primary500, primary200, secondary500, secondary200] = useToken("colors", [
    "primary.500",
    "primary.200",
    "secondary.500",
    "secondary.200",
    "gray.500",
    "gray.200",
  ])
  const b3trColor = useColorModeValue(primary500, primary200)
  const vot3Color = useColorModeValue(secondary500, secondary200)
  return { b3trColor, vot3Color }
}
