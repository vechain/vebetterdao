import { Container, HStack } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import { ThemeSwitcher } from "../ThemeSwitcher"
import dynamic from "next/dynamic"

const ConnectButtonWithModal = dynamic(
  () => import("@vechain/dapp-kit-react").then(mod => mod.ConnectButtonWithModal),
  { ssr: false },
)

export const DesktopNavBar = () => {
  return (
    <Container display={"flex"} justifyContent={"space-between"} w={"full"} maxW="7xl">
      <HStack w={"25%"} justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      <HStack spacing={4} w={"50%"} justifyContent={"center"}>
        <NavbarMenu />
      </HStack>
      <HStack spacing={4} w={"25%"} justifyContent={"end"}>
        <ThemeSwitcher />
        <ConnectButtonWithModal />
      </HStack>
    </Container>
  )
}
