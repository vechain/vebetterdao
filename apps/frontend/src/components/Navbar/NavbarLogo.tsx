import { Box, Icon, Link } from "@chakra-ui/react"
import NextLink from "next/link"

import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import VBDLogo from "@/components/Icons/svg/vebetter-dao-logo.svg"

type Props = {
  collapsed?: boolean
}

export const NavbarLogo = ({ collapsed = false }: Props) => (
  <Link asChild>
    <NextLink href={"/"}>
      <Box
        w={collapsed ? "10" : "32"}
        minW={collapsed ? "10" : "32"}
        overflow="hidden"
        lineHeight={0}
        transition="width 0.4s ease">
        {collapsed ? (
          <Icon as={B3trIcon} w="22px" color="actions.primary.default" display="block" mx="auto" />
        ) : (
          <Icon as={VBDLogo} w="32" color="icon.default" display="block" />
        )}
      </Box>
    </NextLink>
  </Link>
)
