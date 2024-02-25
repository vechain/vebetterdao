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

  const strongAlpha = useColorModeValue("100", "200")
  const weakAlpha = useColorModeValue("50", "100")
  const b3trBgGradient = `linear(90deg, primary.${strongAlpha}, primary.${weakAlpha})`
  const vot3BgGradient = `linear(90deg, secondary.${strongAlpha}, secondary.${weakAlpha})`

  const dividerAlpha = useColorModeValue("500", "600")
  const b3trDividerColor = `primary.${dividerAlpha}`
  const vot3dividerAlpha = `secondary.${dividerAlpha}`
  return { b3trColor, vot3Color, b3trBgGradient, vot3BgGradient, b3trDividerColor, vot3dividerAlpha }
}
