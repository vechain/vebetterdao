"use client"
import { Button, Icon, HoverCard, Portal, Text, useMediaQuery, VStack, Collapsible, HStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    if (route?.subRoutes) {
      return route.subRoutes.some(
        subRoute => typeof subRoute.onClick === "string" && pathname.startsWith(subRoute.onClick),
      )
    }
    if (route.onClick.startsWith("/profile")) return pathname === "/profile"
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
  const { t } = useTranslation()
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
            {/* @ts-expect-error dynamic translation key */}
            {t(route.name)}
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
                    {/* @ts-expect-error dynamic translation key */}
                    <Text textStyle={"md"}>{t(subRoute.name)}</Text>
                    {/* @ts-expect-error dynamic translation key */}
                    <Text textStyle={"sm"}>{subRoute.description && t(subRoute.description)}</Text>
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
  pathname,
  onMenuClick,
}: {
  route: Route
  selected: boolean
  pathname: string
  onMenuClick?: () => void
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(selected)

  return (
    <VStack w="full" align="stretch" gap={0}>
      <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            size="sm"
            w="full"
            display="flex"
            justifyContent="space-between"
            bg={isOpen ? "card.hover" : "transparent"}
            _expanded={{ bg: "card.hover" }}>
            <HStack w="full" gap={4}>
              <Icon as={route.icon} color="text.subtle" boxSize="24px" />
              <Text textStyle="lg" fontWeight={selected ? "semibold" : "normal"}>
                {/* @ts-expect-error dynamic translation key */}
                {t(route.name)}
              </Text>
            </HStack>
            <Icon
              as={FaChevronDown}
              boxSize="14px"
              color="text.subtle"
              transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
              transition="transform 0.2s"
              transformOrigin="center"
              flexShrink={0}
            />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <VStack
            w="full"
            align="stretch"
            gap={1}
            mt={2}
            ml={6}
            pl={3}
            borderLeftWidth="1px"
            borderColor="border.primary">
            {route.subRoutes?.map(subRoute => {
              const subRouteSelected = isSelected(subRoute, pathname)
              return (
                <Button
                  key={subRoute.name}
                  variant="ghost"
                  size="sm"
                  w="full"
                  justifyContent="flex-start"
                  textAlign="left"
                  position="relative"
                  pl={4}
                  _before={
                    subRouteSelected
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: "3px",
                          bg: "border.active",
                          borderRadius: "full",
                        }
                      : undefined
                  }
                  onClick={handleClick(subRoute, router, onMenuClick)}>
                  <Text
                    textStyle="md"
                    fontWeight={subRouteSelected ? "semibold" : "normal"}
                    color={subRouteSelected ? "text.default" : "text.subtle"}>
                    {/* @ts-expect-error dynamic translation key */}
                    {t(subRoute.name)}
                  </Text>
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
  const { t } = useTranslation()
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
          {/* @ts-expect-error dynamic translation key */}
          {t(route.name)}
        </Button>
      )
    }

    // Mobile rendering
    if (hasSubRoutes) {
      return (
        <MobileAccordionWithSubRoutes
          key={route.name}
          route={route}
          selected={selected}
          pathname={pathname}
          onMenuClick={onMenuClick}
        />
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
        data-testid={selected ? "current-section" : ""}>
        <HStack w="full" gap={4}>
          <Icon as={route.icon} color="text.subtle" boxSize="24px" />
          <Text textAlign="left" textStyle="lg">
            {/* @ts-expect-error dynamic translation key */}
            {t(route.name)}
          </Text>
        </HStack>
      </Button>
    )
  }

  return (
    <>
      {isLargerThan1200 ? (
        routesToRender.map(renderRoute)
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" gap="6" pt={5} w="full">
          {routesToRender.map(renderRoute)}
        </MotionVStack>
      )}
    </>
  )
}
