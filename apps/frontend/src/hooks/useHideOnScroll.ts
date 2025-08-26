import { useState, useEffect } from "react"
import { useMediaQuery } from "@chakra-ui/react"

/**
 * Custom hook to manage navbar visibility based on scroll direction on mobile devices.
 *
 * @returns {boolean} A boolean indicating whether the navbar should be visible.
 */
export const useHideOnScroll = (): boolean => {
  const [isNavbarVisible, setIsNavbarVisible] = useState<boolean>(true)
  const [lastScrollY, setLastScrollY] = useState<number>(0)
  const [isMobile] = useMediaQuery(["(max-width: 767px)"])

  useEffect(() => {
    // Always show navbar on non-mobile devices
    if (!isMobile) {
      setIsNavbarVisible(true)
      return
    }

    /** Flag to prevent multiple scroll events from being processed simultaneously */
    let ticking = false

    /**
     * Handles scroll events and updates navbar visibility.
     * Uses requestAnimationFrame for performance optimization.
     */
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          // Hide navbar when scrolling down and past 100px
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsNavbarVisible(false)
          }
          // Show navbar when scrolling up
          else if (currentScrollY < lastScrollY) {
            setIsNavbarVisible(true)
          }

          setLastScrollY(currentScrollY)
          ticking = false
        })

        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isMobile, lastScrollY])

  return isNavbarVisible
}
