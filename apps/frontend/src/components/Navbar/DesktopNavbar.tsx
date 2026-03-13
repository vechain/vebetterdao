import { HStack, Box } from "@chakra-ui/react"
import dynamic from "next/dynamic"

import { ColorModeButton } from "../ui/color-mode"

import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import { Route } from "./Routes"

const ConnectWalletButton = dynamic(
  () => import("../../components/ConnectWalletButton/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)
type Props = {
  routesToRender: Route[]
}
export const DesktopNavBar: React.FC<Props> = ({ routesToRender }) => {
  return (
    <>
      <HStack flex="1" justifyContent={"start"}>
        <NavbarLogo />
      </HStack>
      {!!routesToRender.length && (
        <Box position="absolute" left="50%" transform="translateX(-50%)" zIndex={1}>
          <HStack
            gap={2}
            justifyContent="center"
            borderRadius="full"
            border="sm"
            borderColor="border.secondary"
            bg="bg.primary"
            p={2}>
            <NavbarMenu routesToRender={routesToRender} />
          </HStack>
        </Box>
      )}
      <HStack flex="1" gap={4} justifyContent={"end"} alignItems={"center"}>
        <ColorModeButton />
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
