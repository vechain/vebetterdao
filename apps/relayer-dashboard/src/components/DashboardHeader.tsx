"use client"

import {
  Box,
  Button,
  CloseButton,
  Drawer,
  Heading,
  HStack,
  Icon,
  IconButton,
  Portal,
  Separator,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { WalletButton } from "@vechain/vechain-kit"
import { LuHouse, LuInfo, LuMenu, LuRadar } from "react-icons/lu"

import { useNavigation } from "@/hooks/useNavigation"

export type NavPage = "home" | "relayer" | "info"

const ROUTES: { value: NavPage; label: string; icon: typeof LuHouse }[] = [
  { value: "home", label: "Home", icon: LuHouse },
  { value: "relayer", label: "My Relayer", icon: LuRadar },
  { value: "info", label: "Info", icon: LuInfo },
]

export function DashboardHeader() {
  const [isDesktop] = useMediaQuery(["(min-width: 1200px)"])
  const { open, onClose, onOpen } = useDisclosure()
  const { activePage, setActivePage } = useNavigation()

  return (
    <Box bg="bg.secondary" px={0} position="sticky" top={0} zIndex={3} w="full">
      <HStack justify="space-between" p={isDesktop ? "16px 48px" : "8px 20px"}>
        <HStack flex="1" justifyContent="start">
          <Heading size="lg" fontWeight="bold">
            {"Relayer Dashboard"}
          </Heading>
        </HStack>

        {isDesktop && (
          <Box position="absolute" left="50%" transform="translateX(-50%)" zIndex={1}>
            <HStack
              gap={2}
              justifyContent="center"
              borderRadius="full"
              border="sm"
              borderColor="border.secondary"
              bg="bg.primary"
              p={2}>
              {ROUTES.map(route => (
                <Button
                  key={route.value}
                  border="none"
                  rounded="full"
                  variant={activePage === route.value ? "subtle" : "ghost"}
                  onClick={() => setActivePage(route.value)}
                  size="sm"
                  fontWeight={activePage === route.value ? "bold" : "normal"}
                  textStyle="sm"
                  px="4"
                  py="2">
                  {route.label}
                </Button>
              ))}
            </HStack>
          </Box>
        )}

        <HStack flex="1" gap={2} justifyContent="end" alignItems="center">
          <WalletButton
            buttonStyle={{
              variant: "primaryAction",
              size: "md",
              borderRadius: "full",
              bg: "#004CFC",
              textColor: "white",
            }}
            connectionVariant="popover"
          />

          {!isDesktop && (
            <IconButton onClick={onOpen} variant="ghost" rounded="6px" aria-label="Open menu">
              <Icon boxSize={6} color="icon.default">
                <LuMenu />
              </Icon>
            </IconButton>
          )}
        </HStack>
      </HStack>

      {!isDesktop && (
        <Drawer.Root size="sm" placement="end" open={open} onOpenChange={e => !e.open && onClose()}>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content maxWidth="95%" borderTopLeftRadius={16} borderBottomLeftRadius={16}>
                <Drawer.CloseTrigger asChild>
                  <CloseButton position="absolute" top={4} right={4} size="sm" />
                </Drawer.CloseTrigger>

                <Drawer.Header>
                  <Heading size="lg" fontWeight="bold">
                    {"Relayer Dashboard"}
                  </Heading>
                </Drawer.Header>

                <Drawer.Body px={5}>
                  <VStack gap={0} w="full" align="stretch">
                    <Separator my={2} />
                    {ROUTES.map(route => (
                      <Button
                        key={route.value}
                        variant="ghost"
                        w="full"
                        display="flex"
                        justifyContent="flex-start"
                        alignItems="center"
                        gap={4}
                        fontWeight={activePage === route.value ? "bold" : "normal"}
                        onClick={() => {
                          setActivePage(route.value)
                          onClose()
                        }}>
                        <Icon color="text.subtle" boxSize={5}>
                          <route.icon />
                        </Icon>
                        {route.label}
                      </Button>
                    ))}
                  </VStack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      )}
    </Box>
  )
}
