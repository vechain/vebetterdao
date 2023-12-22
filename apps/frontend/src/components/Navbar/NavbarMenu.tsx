import { Button, Icon } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { Routes } from "./Routes"

export const NavbarMenu = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      {Routes.map(route => {
        if (route.component) return route.component
        const isSelected = pathname === route.onClick
        const onClick = () => {
          if (!route.onClick || isSelected) return
          if (typeof route.onClick === "string") {
            router.push(route.onClick)
          } else route.onClick()
        }

        if (!route.isVisible) return null

        return (
          <Button
            leftIcon={<Icon as={route.icon} />}
            key={route.name}
            variant={"ghost"}
            borderBottom={isSelected ? "2px solid" : "none"}
            onClick={onClick}>
            {route.name}
          </Button>
        )
      })}
    </>
  )
}
