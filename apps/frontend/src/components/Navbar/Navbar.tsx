"use client"
import { Box, HStack, useMediaQuery } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAccountPermissions } from "../../api/contracts/account/hooks/useAccountPermissions"
import { useAllocationsRoundsEvents } from "../../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import { useGetUserNodes } from "../../api/contracts/xNodes/useGetUserNodes"
import { useHideOnScroll } from "../../hooks/useHideOnScroll"

import { DesktopNavBar } from "./DesktopNavbar"
import { MobileNavBar } from "./MobileNavbar"
import { Routes } from "./Routes"

export const Navbar: React.FC = () => {
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])
  const { account } = useWallet()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
  const { data: userNodesInfo } = useGetUserNodes()
  const isNavbarVisible = useHideOnScroll()
  const hasNodes = (userNodesInfo?.nodesManagedByUser?.length ?? 0) > 0
  const routesToRender = useMemo(
    () =>
      Routes.filter(route => {
        return (
          route.isVisible &&
          (route.name === "Allocations" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Admin"
            ? (getConfig().environment === "testnet-staging" || permissions?.isAdmin) && !!account?.address
            : true) &&
          (route.name === "Governance" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Profile" ? isLargerThan1200 && !!account?.address : true) &&
          (route.name === "Nodes" ? !!account?.address && hasNodes : true)
        )
      }),
    [account?.address, allocationRoundsEvents?.created?.length, permissions, isLargerThan1200, hasNodes],
  )
  const parsedRoutesToRender = useMemo(() => {
    if (routesToRender.length === 1 && routesToRender[0]?.name === "Dashboard") return []
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
