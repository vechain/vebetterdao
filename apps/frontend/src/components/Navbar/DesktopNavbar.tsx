import { HStack, useMediaQuery } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import dynamic from "next/dynamic"
import { Route } from "./Routes"
import { NavbarBalance } from "./NavbarBalance"
import { LanguageSelector } from "./LanguageSelector"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

type Props = {
  routesToRender: Route[]
}
export const DesktopNavBar: React.FC<Props> = ({ routesToRender }) => {
  const [isLargerThan1250] = useMediaQuery("(min-width: 1250px)")
  return (
    <>
      <HStack flex={1} justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      {/* {TODO: dark mode support} */}
      {!!routesToRender.length && (
        <HStack
          spacing={4}
          justifyContent={"center"}
          borderRadius={"full"}
          borderWidth={1}
          borderColor={"rgba(0,0,0, 0.06)"}
          bg={"rgba(255, 255, 255, 0.50)"}
          py={2}
          px={4}>
          <NavbarMenu routesToRender={routesToRender} />
        </HStack>
      )}
      <HStack flex={1} spacing={4} justifyContent={"end"}>
        {/* <ThemeSwitcher /> */}
        {isLargerThan1250 && <NavbarBalance />}
        <LanguageSelector />
        <ConnectWalletButton />
      </HStack>
    </>
  )
}
