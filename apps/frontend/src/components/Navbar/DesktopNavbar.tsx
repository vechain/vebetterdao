import { HStack } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import dynamic from "next/dynamic"
import { Route } from "./Routes"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

type Props = {
  routesToRender: Route[]
}
export const DesktopNavBar: React.FC<Props> = ({ routesToRender }) => {
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
        <ConnectWalletButton />
      </HStack>
    </>
  )
}
