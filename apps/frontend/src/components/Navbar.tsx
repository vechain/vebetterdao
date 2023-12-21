"use client"
import { Button, VStack } from "@chakra-ui/react"
import { VechainLogo } from "./VechainLogo"
import { ThemeSwitcher } from "./ThemeSwitcher"
import { usePathname } from "next/navigation"

import dynamic from "next/dynamic"
import { Link } from "@chakra-ui/next-js"

const Menu = [
  { name: "Home", href: "/" },
  { name: "Staking", href: "/staking" },
]

const ConnectButtonWithModal = dynamic(
  async () => {
    const { ConnectButtonWithModal } = await import("@vechain/dapp-kit-react")
    return ConnectButtonWithModal
  },
  {
    ssr: false,
  },
)
const MenuButtons = () => {
  const pathname = usePathname()

  return (
    <VStack spacing={1}>
      {Menu.map(item => {
        const isActive = pathname === item.href
        return (
          <Link href={item.href} key={item.name}>
            <Button
              key={item.name}
              variant={isActive ? "solid" : "ghost"}
              colorScheme={isActive ? "blue" : undefined}
              w="full"
              justifyContent="center">
              {item.name}
            </Button>
          </Link>
        )
      })}
    </VStack>
  )
}

export const SideBar = () => {
  return (
    <VStack
      px={12}
      py={6}
      as="aside"
      h="100vh"
      position={"sticky"}
      top={0}
      left={0}
      boxShadow={"md"}
      borderLeftWidth={1}
      borderRightWidth={1}
      borderColor={"gray.500"}
      mr="8"
      justify="space-between"
      zIndex={10}>
      <VStack spacing={8}>
        <VechainLogo />
        <ConnectButtonWithModal />
      </VStack>
      <MenuButtons />
      <ThemeSwitcher />
    </VStack>
  )
}
