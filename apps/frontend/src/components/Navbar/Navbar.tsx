"use client"
import { Box, HStack, useMediaQuery } from "@chakra-ui/react"
import { useColorModeValue } from "@/components/ui/color-mode"
import { MobileNavBar } from "./MobileNavbar"
import { DesktopNavBar } from "./DesktopNavbar"
import { useAllocationsRoundsEvents } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { Routes } from "./Routes"
import { useHideOnScroll } from "@/hooks"

export const Navbar: React.FC = () => {
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])

  const { account } = useWallet()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const isNavbarVisible = useHideOnScroll()

  // Filter routes based on user's role and if there are any allocation rounds
  const routesToRender = useMemo(
    () =>
      Routes.filter(route => {
        return (
          route.isVisible &&
          (route.name === "Allocations" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Admin" ? permissions?.isAdmin : true) &&
          (route.name === "Governance" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Profile" ? isLargerThan1200 && !!account?.address : true)
        )
      }),
    [account?.address, allocationRoundsEvents?.created?.length, permissions, isLargerThan1200],
  )

  const parsedRoutesToRender = useMemo(() => {
    if (routesToRender.length === 1 && routesToRender[0]?.name === "Dashboard") return []
    return routesToRender
  }, [routesToRender])

  const bg = useColorModeValue("#F7F7F7", "#131313")
  const borderColor = useColorModeValue("#EEEEEE", "#2D2D2F")
  return (
    <Box
      bg={bg}
      px={0}
      position={"sticky"}
      top={0}
      zIndex={3}
      h={"auto"}
      w={"full"}
      transition="transform 0.3s ease-in-out"
      transform={isNavbarVisible ? undefined : "translateY(-100%)"}>
      <HStack
        justify={"space-between"}
        p={isLargerThan1200 ? "16px 48px" : "8px 20px"}
        borderBottom={`1px solid ${borderColor}`}>
        {isLargerThan1200 ? (
          <DesktopNavBar routesToRender={parsedRoutesToRender} />
        ) : (
          <MobileNavBar routesToRender={parsedRoutesToRender} />
        )}
      </HStack>
    </Box>
  )
}
