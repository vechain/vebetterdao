import { HStack } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import { ThemeSwitcher } from "../ThemeSwitcher"
import dynamic from "next/dynamic"

const WalletButton = dynamic(() => import("@vechain/dapp-kit-react").then(mod => mod.WalletButton), { ssr: false })

export const DesktopNavBar = () => {
  return (
    <>
      <HStack flex={1} justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      {/* {TODO: dark mode support} */}
      <HStack
        spacing={4}
        justifyContent={"center"}
        borderRadius={"full"}
        borderWidth={1}
        borderColor={"rgba(0,0,0, 0.06)"}
        bg={"rgba(255, 255, 255, 0.50)"}
        py={2}
        px={4}>
        <NavbarMenu />
      </HStack>
      <HStack flex={1} spacing={4} justifyContent={"end"}>
        <ThemeSwitcher />
        <WalletButton />
      </HStack>
    </>
  )
}
