import { Icon, Link } from "@chakra-ui/react"
import NextLink from "next/link"

import VBDLogo from "@/components/Icons/svg/vebetter-dao-logo.svg"

export const NavbarLogo = () => (
  <Link asChild>
    <NextLink href={"/"}>
      <Icon w="32" as={VBDLogo} color="icon.default" />
    </NextLink>
  </Link>
)
