import { useMediaQuery, useTheme } from "@chakra-ui/react"

export const useBreakpoints = () => {
  const { __breakpoints } = useTheme()

  const [isDesktop] = useMediaQuery(`(min-width: ${__breakpoints?.asObject.lg})`)

  return { isDesktop, isMobile: !isDesktop }
}
