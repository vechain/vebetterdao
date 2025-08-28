import { Box, Button, HStack, Icon, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { Route } from "./Routes"
import { FaChevronRight } from "react-icons/fa6"
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

export const NavbarMenu = ({ onMenuClick, routesToRender }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isLargerThan1200] = useMediaQuery(["(min-width: 1200px)"])

  return (
    <>
      {isLargerThan1200 ? (
        // Render desktop menu without animations
        routesToRender.map(route => {
          if (route.component) return route.component

          const selected = isSelected(route, pathname)
          const onClick = handleClick(route, router, onMenuClick)

          return (
            <Button
              key={route.name}
              border="none"
              bgColor={selected ? "actions.primary.default" : "transparent"}
              _hover={{ bgColor: selected ? "actions.primary.default" : "bg.subtle" }}
              color={selected ? "white" : "inherit"}
              // colorPalette={selected ? "primary" : "gray"}
              // variant={selected ? "primaryAction" : "ghost"}
              rounded={"full"}
              w={["full", "full", "auto"]}
              onClick={onClick}
              size="md"
              fontWeight="semibold"
              fontSize="md"
              data-testid={selected ? "current-section" : ""}>
              <Icon as={route.icon} boxSize={4} />
              {route.name}
            </Button>
          )
        })
      ) : (
        <MotionVStack initial={"hidden"} animate="visible" variants={containerVariants} gap={0}>
          {routesToRender.map((route, index) => {
            if (route.component) return route.component
            const selected = isSelected(route, pathname)
            return (
              <MotionHStack
                key={route.name}
                bgColor={selected ? "actions.primary.default" : "transparent"}
                color={selected ? "white" : "inherit"}
                w={"full"}
                borderRadius={9}
                p={4}
                mt={index === 0 ? 4 : 0}
                justifyContent={"space-between"}
                onClick={() => handleClick(route, router, onMenuClick)}
                variants={itemVariants}>
                <HStack alignItems={"flex-start"}>
                  <Box p={0.5}>
                    <Icon as={route.icon} />
                  </Box>
                  <VStack alignItems={"start"} gap={0}>
                    <Text fontSize={16} fontWeight={600}>
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
