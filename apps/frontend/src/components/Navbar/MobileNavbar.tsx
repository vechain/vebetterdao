import {
  Box,
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
import { ThemeSwitcher } from "../ThemeSwitcher"
import { Route } from "./Routes"

const WalletButton = dynamic(() => import("@vechain/dapp-kit-react").then(mod => mod.WalletButton), { ssr: false })

const MobileMenuDrawer: React.FC<Omit<DrawerProps & Props, "children">> = ({ routesToRender, ...props }) => {
  return (
    <Drawer size={"xs"} placement="right" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{"Menu"}</DrawerHeader>
        <DrawerBody display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
          <VStack spacing={4} w="full">
            <NavbarMenu routesToRender={routesToRender} onMenuClick={props.onClose} />
          </VStack>
          <Box w="full" alignSelf="flex-end">
            <ThemeSwitcher w={"full"} withText={true} />
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

type Props = {
  routesToRender: Route[]
}
export const MobileNavBar: React.FC<Props> = ({ routesToRender }) => {
  const { isOpen: isMenuOpen, onClose: closeMenu, onOpen: openMenu } = useDisclosure()

  return (
    <>
      <NavbarLogo />
      <HStack gap={2}>
        <WalletButton mobile={true} />
        {!!routesToRender.length && (
          <IconButton onClick={openMenu} icon={<Icon as={FaBars} />} aria-label="Open menu" />
        )}
      </HStack>
      {!!routesToRender.length && (
        <MobileMenuDrawer isOpen={isMenuOpen} onClose={closeMenu} routesToRender={routesToRender} />
      )}
    </>
  )
}
