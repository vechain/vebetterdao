"use client"
import { Box, Container, useMediaQuery } from "@chakra-ui/react"

import { MobileNavBar } from "./MobileNavbar"
import { DesktopNavBar } from "./DesktopNavbar"

export const Navbar: React.FC = () => {
  // ssr-friendly media query with fallback
  const [isDesktop] = useMediaQuery("(min-width: 992px)", {
    ssr: true,
    fallback: false, // return false on the server, and re-evaluate on the client side
  })

  return (
    <Box px={0} position={"sticky"} top={0} zIndex={10} py={4} h={"auto"} w={"full"} mb={10}>
      <Container
        w="full"
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems={"center"}
        maxW="container.xl">
        {isDesktop ? <DesktopNavBar /> : <MobileNavBar />}
      </Container>
    </Box>
  )
}
