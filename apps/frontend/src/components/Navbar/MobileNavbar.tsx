import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  HStack,
  Icon,
  IconButton,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { FaBars } from "react-icons/fa"
import { NavbarMenu } from "./NavbarMenu"
import { NavbarLogo } from "./NavbarLogo"

const ConnectButtonWithModal = dynamic(
  () => import("@vechain/dapp-kit-react").then(mod => mod.ConnectButtonWithModal),
  { ssr: false },
)

const MobileMenuDrawer: React.FC<Omit<DrawerProps, "children">> = props => {
  return (
    <Drawer size={"xs"} placement="right" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{"Menu"}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4} w="full">
            <NavbarMenu />
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

export const MobileNavBar = () => {
  const { isOpen: isMenuOpen, onClose: closeMenu, onOpen: openMenu } = useDisclosure()

  return (
    <>
      <NavbarLogo />

      <HStack gap={2}>
        <ConnectButtonWithModal />
        <IconButton onClick={openMenu} icon={<Icon as={FaBars} />} aria-label="Open menu" />
      </HStack>
      <MobileMenuDrawer isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  )
}
