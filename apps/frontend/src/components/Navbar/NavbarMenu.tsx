import {
  Button,
  Heading,
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { Route } from "./Routes"
import { FaChevronDown, FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"

type Props = {
  onMenuClick?: () => void
  routesToRender: Route[]
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
}

const MotionHStack = motion(HStack)
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

  return (
    <Popover placement="bottom-start" closeOnBlur>
      {({ isOpen }) => (
        <>
          <PopoverTrigger>
            <Button
              colorScheme={selected ? "primary" : "gray"}
              variant={selected ? "primaryAction" : "ghost"}
              rounded="full">
              <Text fontWeight={selected ? "bold" : "normal"}>{route.name}</Text>
              <Icon
                ml={2}
                as={FaChevronDown}
                transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                transition="transform 0.2s"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent w="400px" mt={2}>
            <PopoverBody>
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
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  )
}

export const NavbarMenu = ({ onMenuClick, routesToRender }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isLargerThan1200] = useMediaQuery("(min-width: 1200px)")

  return (
    <>
      {isLargerThan1200 ? (
        // Render desktop menu without animations
        routesToRender.map(route => {
          if (route.component) return route.component

          const selected = isSelected(route, pathname)
          const onClick = handleClick(route, router, onMenuClick)
          const fontWeight = selected ? 600 : 400
          const hasSubRoutes = route?.subRoutes?.length
          if (hasSubRoutes) {
            return <ButtonWithSubRoutes key={route.name} route={route} selected={selected} />
          }
          return (
            <Button
              colorScheme={selected ? "primary" : "gray"}
              rounded={"full"}
              w={["full", "full", "auto"]}
              key={route.name}
              variant={selected ? "primaryAction" : "ghost"}
              onClick={onClick}
              data-testid={selected ? "current-section" : ""}
              fontWeight={fontWeight}>
              {route.name}
              {hasSubRoutes && <FaChevronRight size={16} />}
            </Button>
          )
        })
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" variants={containerVariants} spacing={0}>
          {routesToRender.map((route, index) => {
            if (route.component) return route.component

            const selected = isSelected(route, pathname)
            const bgColor = selected ? "rgba(0, 76, 252, 1)" : "transparent"
            const textColor = selected ? "white" : "inherit"
            const fontWeight = selected ? 600 : 400
            const onClick = handleClick(route, router, onMenuClick)
            return (
              <MotionHStack
                key={route.name}
                w={"full"}
                borderRadius={9}
                bgColor={bgColor}
                p={4}
                color={textColor}
                mt={index === 0 ? 4 : 0}
                justifyContent={"space-between"}
                onClick={onClick}
                // Apply animation variants
                variants={itemVariants}>
                <HStack alignItems={"flex-start"}>
                  <VStack alignItems={"start"} spacing={0}>
                    <Text fontSize={16} fontWeight={fontWeight}>
                      {route.name}
                    </Text>
                    <Text fontSize={13} fontWeight={400}>
                      {t(route.description as any)}
                    </Text>
                  </VStack>
                </HStack>
                {!selected && <FaChevronRight size={16} />}
              </MotionHStack>
            )
          })}
        </MotionVStack>
      )}
    </>
  )
}
