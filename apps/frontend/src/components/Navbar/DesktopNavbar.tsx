import { Box, VStack } from "@chakra-ui/react"
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
    <Box
      as="aside"
      position="sticky"
      top={0}
      zIndex={10}
      alignSelf="flex-start"
      h="100vh"
      w="280px"
      minW="280px"
      borderRight="sm"
      borderColor="border.secondary"
      bg="bg.secondary">
      <VStack h="full" align="stretch" gap={0} p={6}>
        <Box px={3} pb={8}>
          <NavbarLogo />
        </Box>

        <VStack flex={1} minH={0} align="stretch" gap={2} overflowY="auto">
          {!!routesToRender.length && <NavbarMenu routesToRender={routesToRender} />}
        </VStack>

        <VStack align="stretch" gap={3} pt={6} borderTop="sm" borderColor="border.secondary">
          <ColorModeButton w="full" rounded="xl" justifyContent="flex-start" px={4} withText={true} />
          <Box
            w="full"
            css={{
              "& > *": {
                width: "100%",
              },
            }}>
            <ConnectWalletButton
              buttonStyleProps={{
                rounded: "16px",
                width: "100%",
                bg: "var(--vbd-colors-actions-primary-default)",
                textColor: "var(--vbd-colors-actions-primary-text)",
                _hover: { bg: "var(--vbd-colors-actions-primary-hover)" },
                _disabled: { bg: "var(--vbd-colors-actions-primary-disabled)" },
                _focus: { bg: "var(--vbd-colors-actions-primary-pressed)" },
              }}
            />
          </Box>
        </VStack>
      </VStack>
    </Box>
  )
}
