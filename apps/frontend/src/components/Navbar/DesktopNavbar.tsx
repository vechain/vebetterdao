"use client"

import { Box, HStack, Icon, IconButton, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu"

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Box
      as="aside"
      position="sticky"
      top={0}
      zIndex={10}
      alignSelf="flex-start"
      h="100vh"
      w={isCollapsed ? "96px" : "280px"}
      minW={isCollapsed ? "96px" : "280px"}
      borderRight="sm"
      borderColor="border.secondary"
      bg="bg.secondary"
      overflow="hidden"
      transition="width 0.32s ease">
      <VStack h="full" align="stretch" gap={0} p={isCollapsed ? 4 : 6} transition="padding 0.32s ease">
        <Box px={isCollapsed ? 0 : 3} pb={8}>
          {isCollapsed ? (
            <VStack gap={3}>
              <NavbarLogo collapsed={true} />
              <IconButton
                aria-label="Expand sidebar"
                variant="ghost"
                rounded="full"
                size="sm"
                onClick={() => setIsCollapsed(false)}>
                <Icon as={LuPanelLeftOpen} boxSize={4} />
              </IconButton>
            </VStack>
          ) : (
            <HStack justify="space-between" gap={3}>
              <NavbarLogo />
              <IconButton
                aria-label="Collapse sidebar"
                variant="ghost"
                rounded="full"
                size="sm"
                onClick={() => setIsCollapsed(true)}>
                <Icon as={LuPanelLeftClose} boxSize={4} />
              </IconButton>
            </HStack>
          )}
        </Box>

        <VStack flex={1} minH={0} align="stretch" gap={2} overflowY="auto">
          {!!routesToRender.length && <NavbarMenu routesToRender={routesToRender} isCollapsed={isCollapsed} />}
        </VStack>

        <VStack align={isCollapsed ? "center" : "stretch"} gap={3} pt={6} borderTop="sm" borderColor="border.secondary">
          <ColorModeButton
            w={isCollapsed ? "11" : "full"}
            rounded={isCollapsed ? "full" : "xl"}
            justifyContent={isCollapsed ? "center" : "flex-start"}
            px={isCollapsed ? 0 : 4}
            withText={!isCollapsed}
          />
          <Box
            boxSize={isCollapsed ? "11" : undefined}
            w={isCollapsed ? undefined : "full"}
            mx={isCollapsed ? "auto" : undefined}
            display={isCollapsed ? "flex" : undefined}
            alignItems={isCollapsed ? "center" : undefined}
            justifyContent={isCollapsed ? "center" : undefined}
            css={{
              "& > *": {
                width: "100%",
                maxWidth: "100%",
              },
            }}>
            <ConnectWalletButton
              desktopVariant={isCollapsed ? "icon" : undefined}
              buttonStyleProps={{
                borderRadius: isCollapsed ? "18px" : "full",
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                justifyContent: isCollapsed ? "center" : undefined,
                px: isCollapsed ? 0 : undefined,
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
