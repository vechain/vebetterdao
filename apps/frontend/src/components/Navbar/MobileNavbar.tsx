import {
  CloseButton,
  Drawer,
  HStack,
  Icon,
  IconButton,
  Portal,
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
import { ColorModeButton } from "../ui/color-mode"

const ConnectWalletButton = dynamic(
  () => import("@/components/ConnectWalletButton").then(mod => mod.ConnectWalletButton),
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
      <HStack>{isLargerThan500 && <NavbarBalance />}</HStack>
      <HStack gap={2}>
        <ColorModeButton />
        <ConnectWalletButton />
        {!!routesToRender.length && (
          <IconButton
            onClick={openMenu}
            border={"1px solid #EEEEEE"}
            variant="subtle"
            rounded="6px"
            aria-label="Open menu">
            <Icon as={FaBars} boxSize={4} />
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
