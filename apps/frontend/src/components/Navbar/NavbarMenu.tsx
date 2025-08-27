import { Button, Heading, Icon, Popover, Portal, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Route } from "./Routes"
import { FaChevronDown, FaChevronRight } from "react-icons/fa6"
import { motion } from "framer-motion"

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
const ButtonWithSubRoutes = ({ route, selected }: { route: Route; selected: boolean }) => {
  //TODO: Move this to a separate component
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover.Root
      positioning={{ placement: "bottom-start" }}
      closeOnInteractOutside={true}
      open={isOpen}
      onOpenChange={e => setIsOpen(e.open)}>
      <Popover.Trigger asChild>
        <Button
          w={{ base: "full", md: "auto" }}
          colorScheme={selected ? "primary" : "gray"}
          variant={selected ? "primaryAction" : "ghost"}
          rounded="full">
          <Text fontSize="sm" fontWeight={selected ? "bold" : "normal"}>
            {route.name}
          </Text>
          <Icon
            size="xs"
            as={FaChevronDown}
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 0.2s"
          />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="400px" mt={2}>
            <Popover.Body>
              <VStack align="stretch">
                {route.subRoutes?.map(subRoute => {
                  const isSubRouteSelected = typeof subRoute.onClick === "string" && pathname === subRoute.onClick
                  return (
                    <VStack
                      px={4}
                      py={2}
                      key={subRoute.name}
                      textAlign="start"
                      alignItems="flex-start"
                      cursor="pointer"
                      _hover={{
                        bg: "gray.50",
                        _dark: {
                          bg: "gray.700",
                        },
                        borderRadius: "lg",
                      }}
                      onClick={handleClick(subRoute, router)}>
                      <Heading
                        size="xs"
                        fontWeight={isSubRouteSelected ? "bold" : "normal"}
                        color={isSubRouteSelected ? "inherit" : "gray.700"} //TODO: Improve this dark mode handling
                        _dark={{
                          color: isSubRouteSelected ? "white" : "gray.300",
                        }}>
                        {subRoute.name}
                      </Heading>
                      <Text
                        fontSize={13}
                        fontWeight="normal"
                        color={isSubRouteSelected ? "gray.700" : "gray.500"}
                        _dark={{
                          color: isSubRouteSelected ? "gray.100" : "gray.400",
                        }}>
                        {subRoute.description}
                      </Text>
                    </VStack>
                  )
                })}
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}

export const NavbarMenu = ({ onMenuClick, routesToRender }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])

  return (
    <>
      {isLargerThan1200 ? (
        // Render desktop menu without animations
        routesToRender.map(route => {
          if (route.component) return route.component
          const hasSubRoutes = route?.subRoutes?.length
          const selected = isSelected(route, pathname)
          const onClick = handleClick(route, router, onMenuClick)
          const fontWeight = selected ? 600 : 400

          if (hasSubRoutes) {
            return <ButtonWithSubRoutes key={route.name} route={route} selected={selected} />
          }
          return (
            <Button
              border="none"
              colorPalette={selected ? "primary" : "gray"}
              rounded={"full"}
              w={["full", "full", "auto"]}
              key={route.name}
              variant={selected ? "primaryAction" : "ghost"}
              onClick={onClick}
              size="md"
              fontWeight={fontWeight}
              fontSize="sm"
              data-testid={selected ? "current-section" : ""}>
              {route.name}
              {hasSubRoutes && <FaChevronRight size={16} />}
            </Button>
          )
        })
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" gap={0} w="full">
          {routesToRender.map(route => {
            if (route.component) return route.component
            const hasSubRoutes = route?.subRoutes?.length
            const selected = isSelected(route, pathname)
            const onClick = handleClick(route, router, onMenuClick)

            if (hasSubRoutes) {
              return <ButtonWithSubRoutes key={route.name} route={route} selected={selected} />
            }

            return (
              <Button
                variant="ghost"
                w={"full"}
                display="flex"
                justifyContent="flex-start"
                alignItems="center"
                key={route.name}
                onClick={onClick}
                pl={2}
                data-testid={selected ? "current-section" : ""}>
                <Icon as={route.icon} />
                <Text textAlign="left">{route.name}</Text>
              </Button>
            )
          })}
        </MotionVStack>
      )}
    </>
  )
}
