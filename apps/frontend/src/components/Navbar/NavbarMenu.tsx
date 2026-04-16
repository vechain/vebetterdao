"use client"
import { Button, Collapsible, HStack, Icon, Menu, Portal, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronDown } from "react-icons/fa6"

import { useColorModeValue } from "../ui/color-mode"
import { Tooltip } from "../ui/tooltip"

import { Route } from "./Routes"

type Props = {
  isCollapsed?: boolean
  onMenuClick?: () => void
  routesToRender: Route[]
}

const MotionVStack = motion(VStack)

const getSelectedRouteStyles = (selected: boolean, selectedBg?: string) =>
  selected && selectedBg
    ? {
        bg: selectedBg,
        _hover: { bg: selectedBg },
        _active: { bg: selectedBg },
      }
    : {}

const RouteIcon = ({ icon, selected }: { icon?: Route["icon"]; selected: boolean }) => {
  if (!icon) return null

  return (
    <Icon
      as={icon}
      color="text.subtle"
      boxSize="6"
      flexShrink={0}
      transform={selected ? "scale(1.1)" : "scale(1)"}
      transformOrigin="center"
      transition="transform 0.2s ease"
    />
  )
}

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
  selectedBg,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
  selectedBg?: string
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
          <Button
            variant={selected ? "subtle" : "ghost"}
            w="full"
            h="auto"
            rounded="2xl"
            px={4}
            py={3}
            {...getSelectedRouteStyles(selected, selectedBg)}>
            <HStack w="full" gap={3}>
              <RouteIcon icon={route.icon} selected={selected} />
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
                  onClick={handleClick(subRoute, router, onMenuClick)}
                  {...getSelectedRouteStyles(subRouteSelected, selectedBg)}>
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

const DesktopCollapsedRouteButton = ({
  route,
  selected,
  onClick,
  selectedBg,
}: {
  route: Route
  selected: boolean
  onClick: () => void
  selectedBg?: string
}) => {
  const { t } = useTranslation()

  return (
    <Tooltip
      content={
        // @ts-expect-error dynamic translation key
        t(route.name)
      }
      positioning={{ placement: "right", gutter: 12 }}>
      <Button
        border="none"
        rounded="2xl"
        w="full"
        variant={selected ? "subtle" : "ghost"}
        onClick={onClick}
        h="52px"
        data-testid={selected ? "current-section" : ""}
        justifyContent="center"
        px={0}
        {...getSelectedRouteStyles(selected, selectedBg)}>
        <RouteIcon icon={route.icon} selected={selected} />
      </Button>
    </Tooltip>
  )
}

const DesktopCollapsedMenuWithSubRoutes = ({
  route,
  selected,
  onMenuClick,
  selectedBg,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
  selectedBg?: string
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Menu.Root positioning={{ placement: "right-start", gutter: 12 }} lazyMount>
      <Menu.Trigger asChild>
        <Button
          border="none"
          rounded="2xl"
          w="full"
          variant={selected ? "subtle" : "ghost"}
          h="52px"
          data-testid={selected ? "current-section" : ""}
          justifyContent="center"
          px={0}
          {...getSelectedRouteStyles(selected, selectedBg)}>
          <RouteIcon icon={route.icon} selected={selected} />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW="220px"
            rounded="2xl"
            p={2}
            border="sm"
            borderColor="border.secondary"
            bg="bg.secondary"
            boxShadow="lg">
            {route.subRoutes?.map(subRoute => {
              const subRouteSelected = isSelected(subRoute, pathname)

              return (
                <Menu.Item
                  key={subRoute.name}
                  value={subRoute.name}
                  rounded="xl"
                  fontWeight={subRouteSelected ? "bold" : "normal"}
                  onClick={handleClick(subRoute, router, onMenuClick)}
                  {...getSelectedRouteStyles(subRouteSelected, selectedBg)}>
                  {/* @ts-expect-error dynamic translation key */}
                  {t(subRoute.name)}
                </Menu.Item>
              )
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

const MobileAccordionWithSubRoutes = ({
  route,
  selected,
  onMenuClick,
  selectedBg,
}: {
  route: Route
  selected: boolean
  onMenuClick?: () => void
  selectedBg?: string
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(selected)

  useEffect(() => {
    if (selected) setIsOpen(true)
  }, [selected])

  return (
    <VStack w="full" align="stretch" p={0} ml="-5px">
      <Collapsible.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            _expanded={selected ? { bg: selectedBg } : { bg: "transparent" }}
            w="full"
            {...getSelectedRouteStyles(selected, selectedBg)}>
            <HStack w="full" gap={3}>
              <RouteIcon icon={route.icon} selected={selected} />
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
              const subRouteSelected = isSelected(subRoute, pathname)

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
                  onClick={handleClick(subRoute, router, onMenuClick)}
                  {...getSelectedRouteStyles(subRouteSelected, selectedBg)}>
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

export const NavbarMenu = ({ isCollapsed = false, onMenuClick, routesToRender }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])
  const selectedRouteBg = useColorModeValue("bg.tertiary", undefined)

  const renderRoute = (route: Route) => {
    if (route.component) return route.component

    const hasSubRoutes = route?.subRoutes?.length
    const selected = isSelected(route, pathname)
    const onClick = handleClick(route, router, onMenuClick)

    if (isLargerThan1200) {
      if (hasSubRoutes) {
        if (isCollapsed) {
          return (
            <DesktopCollapsedMenuWithSubRoutes
              key={route.name}
              route={route}
              selected={selected}
              onMenuClick={onMenuClick}
              selectedBg={selectedRouteBg}
            />
          )
        }

        return (
          <DesktopAccordionWithSubRoutes
            key={route.name}
            route={route}
            selected={selected}
            onMenuClick={onMenuClick}
            selectedBg={selectedRouteBg}
          />
        )
      }

      if (isCollapsed) {
        return (
          <DesktopCollapsedRouteButton
            key={route.name}
            route={route}
            selected={selected}
            onClick={onClick}
            selectedBg={selectedRouteBg}
          />
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
          py={3}
          {...getSelectedRouteStyles(selected, selectedRouteBg)}>
          <RouteIcon icon={route.icon} selected={selected} />
          <Text textStyle="md" textAlign="left">
            {/* @ts-expect-error dynamic translation key */}
            {t(route.name)}
          </Text>
        </Button>
      )
    }

    if (hasSubRoutes) {
      return (
        <MobileAccordionWithSubRoutes
          key={route.name}
          route={route}
          selected={selected}
          onMenuClick={onMenuClick}
          selectedBg={selectedRouteBg}
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
        data-testid={selected ? "current-section" : ""}
        gap={4}
        {...getSelectedRouteStyles(selected, selectedRouteBg)}>
        <RouteIcon icon={route.icon} selected={selected} />
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
