"use client"
import { Button, Icon, HoverCard, Portal, Text, useMediaQuery, VStack, Collapsible, HStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { FaChevronDown } from "react-icons/fa6"

import { Route } from "./Routes"
type Props = {
  onMenuClick?: () => void
  routesToRender: Route[]
}
const MotionVStack = motion(VStack)
const isSelected = (route: Route, pathname: string) => {
  if (route.onClick === "/") return pathname === "/"
  if (typeof route.onClick === "string") {
    if (route.onClick.startsWith("/profile")) return pathname === "/profile"
    if (route?.subRoutes) {
      // If it has subroutes, it's selected if any of its subroutes are selected
      return route.subRoutes.some(
        subRoute => typeof subRoute.onClick === "string" && pathname.startsWith(subRoute.onClick),
      )
    }
    return pathname.startsWith(route.onClick)
  }
  return false
}
const handleClick = (route: Route, router: any, onMenuClick?: () => void) => () => {
  if (!route.onClick) return
  if (typeof route.onClick === "string") {
    router.push(route.onClick)
  } else {
    route.onClick()
  }
  onMenuClick?.()
}
const DesktopButtonWithSubRoutes = ({ route, selected }: { route: Route; selected: boolean }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <HoverCard.Root
      positioning={{ placement: "bottom-start" }}
      openDelay={100}
      closeDelay={150}
      open={isOpen}
      onOpenChange={e => setIsOpen(e.open)}>
      <HoverCard.Trigger asChild>
        <Button w={{ base: "full", md: "auto" }} variant={selected ? "subtle" : "ghost"} rounded="full">
          <Text textStyle="sm" fontWeight={selected ? "bold" : "normal"}>
            {route.name}
          </Text>
          <Icon
            size="xs"
            as={FaChevronDown}
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 0.2s"
            transformOrigin="center"
            width="12px"
            height="12px"
            flexShrink={0}
          />
        </Button>
      </HoverCard.Trigger>
      <Portal>
        <HoverCard.Positioner>
          <HoverCard.Content mt={"12px"} minW="400px" borderRadius="2xl" p={2} gap={0}>
            <VStack align="stretch" w="full" gap="2">
              {route.subRoutes?.map(subRoute => {
                return (
                  <VStack
                    key={subRoute.name}
                    textAlign="start"
                    alignItems="flex-start"
                    cursor="pointer"
                    borderRadius="2xl"
                    p={3}
                    color={"text.subtle"}
                    _hover={{
                      bg: "card.hover",
                      color: "text.default",
                    }}
                    onClick={() => {
                      handleClick(subRoute, router)()
                      setIsOpen(false)
                    }}>
                    <Text textStyle={"md"}>{subRoute.name}</Text>
                    <Text textStyle={"sm"}>{subRoute.description}</Text>
                  </VStack>
                )
              })}
            </VStack>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </Portal>
    </HoverCard.Root>
  )
}

const MobileAccordionWithSubRoutes = ({
  route,
  selected,
  onMenuClick,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
}) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(selected)

  return (
    <VStack w="full" align="stretch" p={0}>
      <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" _expanded={{ bg: "transparent" }} w="full">
            <HStack w="full" gap={3}>
              <Icon as={route.icon} color="text.subtle" size={"2xl"} />
              <Text textStyle="lg">{route.name}</Text>
            </HStack>
            <Icon
              size="xs"
              as={FaChevronDown}
              transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
              transition="transform 0.2s"
              transformOrigin="center"
              width="12px"
              height="12px"
              flexShrink={0}
            />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content p="1">
          <VStack w="full" align="stretch" pt={5} pl={12}>
            {route.subRoutes?.map(subRoute => {
              return (
                <Button
                  key={subRoute.name}
                  variant="ghost"
                  w="full"
                  display="flex"
                  justifyContent="center"
                  alignItems="flex-start"
                  flexDirection="column"
                  textAlign="left"
                  onClick={handleClick(subRoute, router, onMenuClick)}>
                  <Text textStyle="sm">{subRoute.name}</Text>
                </Button>
              )
            })}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </VStack>
  )
}

export const NavbarMenu = ({ onMenuClick, routesToRender }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])

  const renderRoute = (route: Route) => {
    if (route.component) return route.component

    const hasSubRoutes = route?.subRoutes?.length
    const selected = isSelected(route, pathname)
    const onClick = handleClick(route, router, onMenuClick)

    // Desktop rendering
    if (isLargerThan1200) {
      if (hasSubRoutes) {
        return <DesktopButtonWithSubRoutes key={route.name} route={route} selected={selected} />
      }

      return (
        <Button
          border="none"
          rounded={"full"}
          w={["full", "full", "auto"]}
          key={route.name}
          variant={selected ? "subtle" : "ghost"}
          onClick={onClick}
          size="sm"
          fontWeight={selected ? "bold" : "normal"}
          textStyle="sm"
          data-testid={selected ? "current-section" : ""}
          px="4"
          py="2">
          {route.name}
        </Button>
      )
    }

    // Mobile rendering
    if (hasSubRoutes) {
      return (
        <MobileAccordionWithSubRoutes key={route.name} route={route} selected={selected} onMenuClick={onMenuClick} />
      )
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        w={"full"}
        display="flex"
        justifyContent="flex-start"
        alignItems="center"
        key={route.name}
        onClick={onClick}
        data-testid={selected ? "current-section" : ""}
        gap={4}>
        <Icon as={route.icon} color="text.subtle" size={"xl"} />
        <Text textAlign="left" textStyle="lg">
          {route.name}
        </Text>
      </Button>
    )
  }

  return (
    <>
      {isLargerThan1200 ? (
        routesToRender.map(renderRoute)
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" gap="2" pt={5} w="full">
          {routesToRender.map(renderRoute)}
        </MotionVStack>
      )}
    </>
  )
}
