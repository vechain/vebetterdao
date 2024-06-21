"use client"
import { Box, Container, useColorModeValue, useMediaQuery } from "@chakra-ui/react"
import { MobileNavBar } from "./MobileNavbar"
import { DesktopNavBar } from "./DesktopNavbar"
import { useAllocationsRoundsEvents } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { Routes } from "./Routes"

export const Navbar: React.FC = () => {
  // ssr-friendly media query with fallback
  const [isDesktop] = useMediaQuery("(min-width: 800px)", {
    ssr: true,
    fallback: false, // return false on the server, and re-evaluate on the client side
  })

  const { account } = useWallet()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { isAdmin } = useAccountPermissions(account ?? "")

  // Filter routes based on user's role and if there are any allocation rounds
  const routesToRender = useMemo(
    () =>
      Routes.filter(route => {
        return (
          route.isVisible &&
          (route.name === "Allocations" ? !!allocationRoundsEvents?.created?.length : true) &&
          (route.name === "Admin" ? isAdmin : true) &&
          (route.name === "Governance" ? !!allocationRoundsEvents?.created?.length : true)
        )
      }),
    [allocationRoundsEvents, isAdmin],
  )

  const parsedRoutesToRender = useMemo(() => {
    if (routesToRender.length === 1 && routesToRender[0]?.name === "Dashboard") return []
    return routesToRender
  }, [routesToRender])

  const bg = useColorModeValue("#F7F7F7", "#131313")
  return (
    <Box bg={bg} px={0} position={"sticky"} top={0} zIndex={10} py={4} h={"auto"} w={"full"}>
      <Container
        w="full"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems={"center"}
        maxW="container.xl">
        {isDesktop ? (
          <DesktopNavBar routesToRender={parsedRoutesToRender} />
        ) : (
          <MobileNavBar routesToRender={parsedRoutesToRender} />
        )}
      </Container>
    </Box>
  )
}
