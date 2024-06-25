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
  useMediaQuery,
} from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { FaBars } from "react-icons/fa"
import { NavbarMenu } from "./NavbarMenu"
import { NavbarLogo } from "./NavbarLogo"
import { Route } from "./Routes"
import { NavbarBalance } from "./NavbarBalance"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

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
          {/* <Box w="full" alignSelf="flex-end">
            <ThemeSwitcher w={"full"} withText={true} />
          </Box> */}
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
  const [isBalanceVisible] = useMediaQuery("(min-width: 600px)", {
    ssr: true,
    fallback: false, // return false on the server, and re-evaluate on the client side
  })

  return (
    <>
      <NavbarLogo />
      {isBalanceVisible && <NavbarBalance />}
      <HStack gap={2}>
        <ConnectWalletButton />
        {!!routesToRender.length && (
          <IconButton
            onClick={openMenu}
            border={"1px solid #EEEEEE"}
            bg={"rgba(255, 255, 255, 0.50)"}
            rounded="6px"
            icon={<Icon as={FaBars} />}
            aria-label="Open menu"
          />
        )}
      </HStack>
      {!!routesToRender.length && (
        <MobileMenuDrawer isOpen={isMenuOpen} onClose={closeMenu} routesToRender={routesToRender} />
      )}
    </>
  )
}
