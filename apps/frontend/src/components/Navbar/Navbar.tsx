"use client"
import { Box, HStack, useColorModeValue, useMediaQuery } from "@chakra-ui/react"
import { MobileNavBar } from "./MobileNavbar"
import { DesktopNavBar } from "./DesktopNavbar"
import { useAllocationsRoundsEvents } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { Routes } from "./Routes"

export const Navbar: React.FC = () => {
  // ssr-friendly media query with fallback
  const [isLargerThan1200] = useMediaQuery("(min-width: 1200px)")

  const { account } = useWallet()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  // Filter routes based on user's role and if there are any allocation rounds
  const routesToRender = useMemo(
    () =>
      Routes.filter(route => {
        return (
          route.isVisible &&
          (route.name === "Allocations" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Admin" ? !!account : true) &&
          (route.name === "Governance" ? !!allocationRoundsEvents?.created?.length : true)
        )
      }),
    [allocationRoundsEvents, account],
  )

  const parsedRoutesToRender = useMemo(() => {
    if (routesToRender.length === 1 && routesToRender[0]?.name === "Dashboard") return []
    return routesToRender
  }, [routesToRender])

  const bg = useColorModeValue("#F7F7F7", "#131313")
  return (
    <Box bg={bg} px={0} position={"sticky"} top={0} zIndex={10} h={"auto"} w={"full"}>
      <HStack
        justify={"space-between"}
        p={isLargerThan1200 ? "16px 48px" : "8px 20px"}
        borderBottom="1px solid #EEEEEE">
        {isLargerThan1200 ? (
          <DesktopNavBar routesToRender={parsedRoutesToRender} />
        ) : (
          <MobileNavBar routesToRender={parsedRoutesToRender} />
        )}
      </HStack>
    </Box>
  )
}
