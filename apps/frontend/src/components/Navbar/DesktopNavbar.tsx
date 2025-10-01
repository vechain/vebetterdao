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
      <HStack flex="1" justifyContent={"start"}>
        <NavbarLogo />
      </HStack>

      {!!routesToRender.length && (
        <Box position="absolute" left="50%" transform="translateX(-50%)" zIndex={1}>
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
        </Box>
      )}
      <HStack flex="1" gap={4} justifyContent={"end"} alignItems={"center"}>
        <ColorModeButton />
        {isLargerThan1800 && <NavbarBalance />}
        <Box as="span">
          <ConnectWalletButton
            buttonStyleProps={{
              rounded: "full",
              color: "var(--vbd-colors-actions-primary-text)",
              bgColor: "var(--vbd-colors-actions-primary-default)",
              _hover: { bg: "var(--vbd-colors-actions-primary-hover)" },
              _disabled: { bg: "var(--vbd-colors-actions-primary-disabled)" },
              _focus: { bg: "var(--vbd-colors-actions-primary-pressed)" },
            }}
          />
        </Box>
      </HStack>
    </>
  )
}
