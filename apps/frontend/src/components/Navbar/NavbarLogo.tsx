import { Button, Icon } from "@chakra-ui/react"
import NextLink from "next/link"

import VBDLogo from "@/components/Icons/svg/vebetter-dao-logo.svg"

export const NavbarLogo = () => (
  <Button asChild variant="link">
    <NextLink href={"/"}>
      <Icon w="32" as={VBDLogo} color="icon.default" />
    </NextLink>
  </Button>
)
