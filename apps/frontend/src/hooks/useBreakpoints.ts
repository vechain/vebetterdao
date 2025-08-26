"use client"
import { useMediaQuery } from "@chakra-ui/react"

export const useBreakpoints = () => {
  const [isDesktop] = useMediaQuery(["(min-width: 768px)"])

  return { isDesktop, isMobile: !isDesktop }
}
