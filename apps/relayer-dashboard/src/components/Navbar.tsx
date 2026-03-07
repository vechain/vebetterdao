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
import NextLink from "next/link"
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
          {isDesktop && <ColorModeButton mt="1" rounded="full" />}
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
          <NextLink href="/new-relayer">
            <Button variant="primary" size={isDesktop ? "md" : "sm"} rounded="full">
              <Icon>
                <LuRocket />
              </Icon>
              {isDesktop ? "Become a Relayer" : "Relayer"}
            </Button>
          </NextLink>

          {isDesktop && (
            <>
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
            </>
          )}

          {!isDesktop && (
            <IconButton onClick={onOpen} variant="ghost" rounded="6px" size="lg" aria-label="Open menu">
              <Icon boxSize={7} color="icon.default">
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

                <Drawer.Body px={5} display="flex" flexDirection="column" justifyContent="space-between">
                  <VStack gap={0} w="full" align="stretch">
                    <Box py={3}>
                      <WalletButton
                        buttonStyle={{
                          variant: "outline",
                          size: "md",
                          borderRadius: "full",
                          width: "100%",
                          textColor: walletTextColor,
                          _hover: { bg: walletHoverBg },
                        }}
                        connectionVariant="popover"
                      />
                    </Box>
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
                        size="lg"
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
                  </VStack>
                  <Box pb={6}>
                    <Separator mb={4} />
                    <ColorModeButton withText w="full" display="flex" justifyContent="flex-start" size="lg" gap={4} />
                  </Box>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      )}
    </Box>
  )
}
