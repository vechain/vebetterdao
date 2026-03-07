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
import { usePathname, useRouter } from "next/navigation"
import { LuHouse, LuInfo, LuMenu, LuRadar, LuRocket } from "react-icons/lu"

import { ColorModeButton, useColorModeValue } from "@/components/ui/color-mode"
import { useNavigation } from "@/hooks/useNavigation"

export type NavPage = "home" | "relayer" | "info"

const ROUTES: { value: NavPage; label: string; icon: typeof LuHouse }[] = [
  { value: "home", label: "Home", icon: LuHouse },
  { value: "relayer", label: "My Relayer", icon: LuRadar },
  { value: "info", label: "Info", icon: LuInfo },
]

export function Navbar() {
  const [isDesktop] = useMediaQuery(["(min-width: 1200px)"])
  const { open, onClose, onOpen } = useDisclosure()
  const { activePage, setActivePage } = useNavigation()
  const router = useRouter()
  const pathname = usePathname()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  const walletTextColor = useColorModeValue("#1A1A1A", "#E4E4E4")
  const walletHoverBg = useColorModeValue("#f8f8f8", "#2D2D2F")

  const handleNav = (page: NavPage) => {
    setActivePage(page)
    const isHome = pathname === "/" || pathname === basePath || pathname === `${basePath}/`
    if (!isHome) router.push("/")
  }

  return (
    <Box bg="bg.secondary" px={0} position="sticky" top={0} zIndex={3} w="full">
      <HStack justify="space-between" p={isDesktop ? "16px 48px" : "8px 20px"}>
        <HStack flex="1" justifyContent="start">
          <Heading size="lg" fontWeight="bold">
            {"VeBetter Relayers"}
          </Heading>
          <ColorModeButton mt="1" rounded="full" />
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
                  onClick={() => handleNav(route.value)}
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
          <Button variant="primary" size="md" rounded="full" onClick={() => handleNav("relayer")}>
            <Icon>
              <LuRocket />
            </Icon>
            {"Become a Relayer"}
          </Button>

          <WalletButton
            buttonStyle={{
              variant: "outline",
              size: "md",
              borderRadius: "full",
              textColor: walletTextColor,
              _hover: { bg: walletHoverBg },
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
                    {"VeBetter Relayers"}
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
                          handleNav(route.value)
                          onClose()
                        }}>
                        <Icon color="text.subtle" boxSize={5}>
                          <route.icon />
                        </Icon>
                        {route.label}
                      </Button>
                    ))}
                    <Separator my={2} />
                    <ColorModeButton withText w="full" display="flex" justifyContent="flex-start" gap={4} />
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
