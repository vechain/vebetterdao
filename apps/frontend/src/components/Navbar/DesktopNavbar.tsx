import { HStack, useMediaQuery, Box } from "@chakra-ui/react"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import dynamic from "next/dynamic"
import { Route } from "./Routes"
import { NavbarBalance } from "./NavbarBalance"
import { ColorModeButton } from "../ui/color-mode"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

type Props = {
  routesToRender: Route[]
}
export const DesktopNavBar: React.FC<Props> = ({ routesToRender }) => {
  const [isLargerThan1800] = useMediaQuery(["(min-width: 1800px)"])

  return (
    <>
      <HStack flex="0 0 120px" justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      {!!routesToRender.length && (
        <HStack
          gap={4}
          justifyContent={"center"}
          borderRadius={"full"}
          borderWidth={1}
          borderColor={"rgba(0,0,0, 0.06)"}
          bg={"light-contrast-on-card-bg"}
          py={2}
          px={4}>
          <NavbarMenu routesToRender={routesToRender} />
        </HStack>
      )}
      <HStack flexShrink={0} gap={4} justifyContent={"end"} alignItems={"center"}>
        <ColorModeButton />
        {isLargerThan1800 && <NavbarBalance />}
        <Box as="span">
          <ConnectWalletButton />
        </Box>
      </HStack>
    </>
  )
}
