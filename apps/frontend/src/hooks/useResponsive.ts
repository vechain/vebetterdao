import { useMediaQuery } from "@chakra-ui/react"

export const useResponsive = () => {
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  return { isDesktop }
}
