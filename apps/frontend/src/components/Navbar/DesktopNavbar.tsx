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

      <HStack flex={1.5} spacing={4} justifyContent={"center"}>
        <NavbarMenu />
      </HStack>
      <HStack flex={1} spacing={4} justifyContent={"end"}>
        <ThemeSwitcher />
        <WalletButton />
      </HStack>
    </>
  )
}
