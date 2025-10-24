import {
  CloseButton,
  Drawer,
  HStack,
  Icon,
  IconButton,
  Portal,
  Separator,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { Menu } from "iconoir-react"
import dynamic from "next/dynamic"

import { ColorModeButton } from "../ui/color-mode"

import { NavbarBalance } from "./NavbarBalance"
import { NavbarLogo } from "./NavbarLogo"
import { NavbarMenu } from "./NavbarMenu"
import { ProfileButton } from "./ProfileButton"
import { Route } from "./Routes"
const ConnectWalletButton = dynamic(
  () => import("../../components/ConnectWalletButton/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)
const MobileMenuDrawer: React.FC<Omit<Drawer.RootProps & Props, "children">> = ({
  routesToRender,
  isNotMobile,
  ...props
}) => {
  return (
    <Drawer.Root size={"sm"} placement="end" {...props}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            maxWidth={isNotMobile ? undefined : "95%"}
            borderTopLeftRadius={16}
            borderBottomLeftRadius={16}
            background={"contrast-on-dark-bg"}>
            <Drawer.CloseTrigger asChild>
              <CloseButton
                position={"absolute"}
                top={4}
                right={4}
                color={"gray.500"}
                _hover={{ color: "gray.700" }}
                size="sm"
              />
            </Drawer.CloseTrigger>

            <Drawer.Header>
              <NavbarLogo />
            </Drawer.Header>
            <Drawer.Body display={"flex"} flexDirection={"column"} justifyContent={"space-between"} px={5}>
              <VStack gap={0} w="full">
                <ProfileButton onMenuClose={() => props.onOpenChange?.({ open: false })} />
                <Separator my={2} w="full" color="gray.200" />
                <NavbarMenu routesToRender={routesToRender} onMenuClick={() => props.onOpenChange?.({ open: true })} />
              </VStack>
              <ColorModeButton w={"full"} withText={true} />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

type Props = {
  routesToRender: Route[]
  isNotMobile?: boolean
}
export const MobileNavBar: React.FC<Props> = ({ routesToRender }) => {
  const { open: isMenuOpen, onClose: closeMenu, onOpen: openMenu } = useDisclosure()

  const [isLargerThan500] = useMediaQuery(["(min-width: 500px)"])

  return (
    <>
      <NavbarLogo />
      {isLargerThan500 && (
        <HStack>
          <NavbarBalance />
        </HStack>
      )}

      <HStack gap={2}>
        <ConnectWalletButton />

        {!!routesToRender.length && (
          <IconButton onClick={openMenu} variant={"ghost"} rounded="6px" aria-label="Open menu">
            <Icon as={Menu} boxSize={6} color="icon.default" />
          </IconButton>
        )}
      </HStack>
      {!!routesToRender.length && (
        <MobileMenuDrawer
          open={isMenuOpen}
          onOpenChange={closeMenu}
          routesToRender={routesToRender}
          isNotMobile={isLargerThan500}
        />
      )}
    </>
  )
}
