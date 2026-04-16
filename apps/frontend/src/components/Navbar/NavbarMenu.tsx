"use client"
import { Button, Collapsible, HStack, Icon, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

const DesktopAccordionWithSubRoutes = ({
  route,
  selected,
  onMenuClick,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(selected)

  useEffect(() => {
    if (selected) setIsOpen(true)
  }, [selected])

  return (
    <VStack w="full" align="stretch" p={0} gap={0}>
      <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button variant={selected ? "subtle" : "ghost"} w="full" h="auto" rounded="2xl" px={4} py={3}>
            <HStack w="full" gap={3}>
              <Icon as={route.icon} color="text.subtle" size={"lg"} />
              <Text textStyle="md" textAlign="left" fontWeight={selected ? "bold" : "normal"}>
                {/* @ts-expect-error dynamic translation key */}
                {t(route.name)}
              </Text>
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
        <Collapsible.Content>
          <VStack w="full" align="stretch" gap={1} pt={2} pl={10}>
            {route.subRoutes?.map(subRoute => {
              const subRouteSelected = isSelected(subRoute, pathname)

              return (
                <Button
                  key={subRoute.name}
                  variant={subRouteSelected ? "subtle" : "ghost"}
                  w="full"
                  h="auto"
                  display="flex"
                  justifyContent="flex-start"
                  alignItems="flex-start"
                  flexDirection="column"
                  textAlign="left"
                  rounded="xl"
                  px={4}
                  py={3}
                  onClick={handleClick(subRoute, router, onMenuClick)}>
                  <Text textStyle="sm" fontWeight={subRouteSelected ? "bold" : "normal"}>
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

const MobileAccordionWithSubRoutes = ({
  route,
  selected,
  onMenuClick,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(selected)

  useEffect(() => {
    if (selected) setIsOpen(true)
  }, [selected])

  return (
    <VStack w="full" align="stretch" p={0} ml="-5px">
      <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" _expanded={{ bg: "transparent" }} w="full">
            <HStack w="full" gap={3}>
              <Icon as={route.icon} color="text.subtle" size={"2xl"} />
              {/* @ts-expect-error dynamic translation key */}
              <Text textStyle="lg">{t(route.name)}</Text>
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
                  {/* @ts-expect-error dynamic translation key */}
                  <Text textStyle="sm">{t(subRoute.name)}</Text>
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

    if (isLargerThan1200) {
      if (hasSubRoutes) {
        return (
          <DesktopAccordionWithSubRoutes key={route.name} route={route} selected={selected} onMenuClick={onMenuClick} />
        )
      }

      return (
        <Button
          border="none"
          rounded={"2xl"}
          w={"full"}
          key={route.name}
          variant={selected ? "subtle" : "ghost"}
          onClick={onClick}
          h="auto"
          fontWeight={selected ? "bold" : "normal"}
          data-testid={selected ? "current-section" : ""}
          justifyContent="flex-start"
          gap={3}
          px={4}
          py={3}>
          <Icon as={route.icon} color="text.subtle" size={"lg"} />
          <Text textStyle="md" textAlign="left">
            {/* @ts-expect-error dynamic translation key */}
            {t(route.name)}
          </Text>
        </Button>
      )
    }

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
          {/* @ts-expect-error dynamic translation key */}
          {t(route.name)}
        </Text>
      </Button>
    )
  }

  return (
    <>
      {isLargerThan1200 ? (
        <VStack w="full" align="stretch" gap={2}>
          {routesToRender.map(renderRoute)}
        </VStack>
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" gap="6" pt={5} w="full">
          {routesToRender.map(renderRoute)}
        </MotionVStack>
      )}
    </>
  )
}
