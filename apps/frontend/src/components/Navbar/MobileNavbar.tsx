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
import { ProfileButton } from "./ProfileButton"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
  { ssr: false },
)

const MobileMenuDrawer: React.FC<Omit<DrawerProps & Props, "children">> = ({
  routesToRender,
  isNotMobile,
  ...props
}) => {
  return (
    <Drawer size={"sm"} placement="right" {...props}>
      <DrawerOverlay />
      <DrawerContent maxWidth={isNotMobile ? undefined : "95%"} borderTopLeftRadius={16} borderBottomLeftRadius={16}>
        <DrawerCloseButton position={"absolute"} top={4} right={4} color={"gray.500"} _hover={{ color: "gray.700" }} />
        <DrawerHeader>
          <NavbarLogo />
        </DrawerHeader>
        <DrawerBody display={"flex"} flexDirection={"column"} justifyContent={"space-between"} px={5}>
          <VStack spacing={0} w="full">
            <ProfileButton onMenuClose={props.onClose} />
            <NavbarMenu routesToRender={routesToRender} onMenuClick={props.onClose} />
          </VStack>
          <ThemeSwitcher w={"full"} withText={true} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

type Props = {
  routesToRender: Route[]
  isNotMobile?: boolean
}
export const MobileNavBar: React.FC<Props> = ({ routesToRender }) => {
  const { isOpen: isMenuOpen, onClose: closeMenu, onOpen: openMenu } = useDisclosure()

  const [isLargerThan500] = useMediaQuery("(min-width: 500px)")

  return (
    <>
      <NavbarLogo />
      <HStack>{isLargerThan500 && <NavbarBalance />}</HStack>
      <HStack gap={2}>
        <ThemeSwitcher />
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
        <MobileMenuDrawer
          isOpen={isMenuOpen}
          onClose={closeMenu}
          routesToRender={routesToRender}
          isNotMobile={isLargerThan500}
        />
      )}
    </>
  )
}
