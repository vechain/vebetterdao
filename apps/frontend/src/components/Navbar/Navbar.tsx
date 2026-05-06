"use client"
import { Box, HStack, useMediaQuery } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAccountPermissions } from "../../api/contracts/account/hooks/useAccountPermissions"
import { useAllocationsRoundsEvents } from "../../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useHideOnScroll } from "../../hooks/useHideOnScroll"

import { DesktopNavBar } from "./DesktopNavbar"
import { MobileNavBar } from "./MobileNavbar"
import { Routes } from "./Routes"

export const Navbar: React.FC = () => {
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])
  const { account } = useWallet()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
  const isNavbarVisible = useHideOnScroll()
  const hasRounds = !!allocationRoundsEvents?.created?.length
  const isConnected = !!account?.address

  const routesToRender = useMemo(() => {
    const subRouteVisible: Record<string, boolean> = {
      "Allocation Rounds": hasRounds,
      Proposals: hasRounds,
      Grants: hasRounds,
      Treasury: hasRounds,
      "My Profile": isConnected,
      GM: isConnected,
      Nodes: isConnected,
    }

    return Routes.filter(route => {
      if (!route.isVisible) return false
      if (route.name === "Admin")
        return (getConfig().environment === "testnet-staging" || permissions?.isAdmin) && isConnected
      return true
    })
      .map(route => {
        if (!route.subRoutes) return route
        const filtered = route.subRoutes.filter(sub => subRouteVisible[sub.name] ?? true)
        if (!filtered.length) return null
        // Collapse to flat link when only one sub-route remains
        if (filtered.length === 1) return { ...route, subRoutes: undefined }
        return { ...route, subRoutes: filtered }
      })
      .filter(Boolean) as typeof Routes
  }, [hasRounds, isConnected, permissions])
  const parsedRoutesToRender = useMemo(() => {
    if (routesToRender.length === 1 && routesToRender[0]?.name === "Home") return []
    return routesToRender
  }, [routesToRender])
  return (
    <Box
      bg="bg.secondary"
      px={0}
      position={"sticky"}
      top={0}
      zIndex={3}
      h={"auto"}
      w={"full"}
      transition="transform 0.3s ease-in-out"
      transform={isNavbarVisible ? undefined : "translateY(-100%)"}>
      <HStack justify={"space-between"} p={isLargerThan1200 ? "16px 48px" : "8px 20px"}>
        {isLargerThan1200 ? (
          <DesktopNavBar routesToRender={parsedRoutesToRender} />
        ) : (
          <MobileNavBar routesToRender={parsedRoutesToRender} />
        )}
      </HStack>
    </Box>
  )
}
