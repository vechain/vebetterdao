import { Button, Icon } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { Route } from "./Routes"

type Props = {
  onMenuClick?: () => void
  routesToRender: Route[]
}

export const NavbarMenu = ({ onMenuClick, routesToRender }: Props) => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      {routesToRender.map(route => {
        if (route.component) return route.component
        //check also subpaths
        const isSelected = (() => {
          if (route.onClick === "/") return pathname === "/"
          if (typeof route.onClick === "string") return pathname.startsWith(route.onClick)
          return false
        })()

        const onClick = () => {
          if (!route.onClick) return
          if (typeof route.onClick === "string") {
            router.push(route.onClick)
          } else route.onClick()
          onMenuClick?.()
        }

        return (
          <Button
            colorScheme={isSelected ? "primary" : "gray"}
            rounded={"full"}
            w={["full", "full", "auto"]}
            leftIcon={<Icon as={route.icon} />}
            key={route.name}
            variant={isSelected ? "primaryAction" : "ghost"}
            onClick={onClick}>
            {route.name}
          </Button>
        )
      })}
    </>
  )
}
