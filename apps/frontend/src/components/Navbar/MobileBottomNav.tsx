"use client"
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { LiaBalanceScaleSolid, LiaChartPieSolid, LiaUser } from "react-icons/lia"
import { LuHouse } from "react-icons/lu"
import { PiSquaresFour } from "react-icons/pi"

interface NavItem {
  name: string
  path: string
  icon: React.FC
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LuHouse,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: LiaUser,
  },
  {
    name: "Apps",
    path: "/apps",
    icon: PiSquaresFour,
  },
  {
    name: "Allocations",
    path: "/rounds",
    icon: LiaChartPieSolid,
  },
  {
    name: "Governance",
    path: "/proposals",
    icon: LiaBalanceScaleSolid,
  },
]

const isActiveRoute = (currentPath: string, itemPath: string) => {
  if (itemPath === "/") {
    return currentPath === "/"
  }
  if (itemPath === "/profile") {
    return currentPath === "/profile"
  }
  if (itemPath === "/proposals") {
    return currentPath.startsWith("/proposals") || currentPath.startsWith("/grants")
  }
  return currentPath.startsWith(itemPath)
}

export const MobileBottomNav: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavClick = (path: string) => {
    router.push(path)
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="bg.primary"
      borderTop="1px solid"
      borderColor="border.primary"
      borderTopRadius="20px"
      boxShadow="0px -4px 12px rgba(0, 0, 0, 0.05)"
      px={2}
      py={2}
      display={{ base: "block", lg: "none" }}>
      <HStack justify="space-around" align="stretch" gap={0} w="full">
        {navItems.map(item => {
          const isActive = isActiveRoute(pathname, item.path)
          return (
            <VStack
              key={item.name}
              flex={1}
              gap={1}
              py={1}
              cursor="pointer"
              onClick={() => handleNavClick(item.path)}
              transition="all 0.2s"
              _active={{
                transform: "scale(0.95)",
              }}>
              <Icon
                as={item.icon}
                boxSize={6}
                color={isActive ? "actions.primary.default" : "text.subtle"}
                transition="color 0.2s"
              />
              <Text
                textStyle="xxs"
                fontWeight={isActive ? "bold" : "normal"}
                color={isActive ? "actions.primary.default" : "text.subtle"}
                transition="all 0.2s"
                textAlign="center"
                lineHeight="1">
                {item.name}
              </Text>
            </VStack>
          )
        })}
      </HStack>
    </Box>
  )
}
