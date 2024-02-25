import { Button, Icon } from "@chakra-ui/react"
import { usePathname, useRouter } from "next/navigation"
import { Routes } from "./Routes"
import { useAllocationsRoundsEvents } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { useHasRole, ADMIN_ROLE } from "@/api/contracts/account"
import { useMemo } from "react"

type Props = {
  onMenuClick?: () => void
}

const config = getConfig()

export const NavbarMenu = ({ onMenuClick }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { account } = useWallet()
  const { data: isAdminOfEmissions } = useHasRole(ADMIN_ROLE, config.emissionsContractAddress, account ?? undefined)

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
          onMenuClick?.()
        }

        if (!route.isVisible) return null

        if (route.name === "Allocations" && allocationRoundsEvents?.created.length === 0) return null

        if (route.name === "Admin" && (!account || !isAdminOfEmissions)) return null

        return (
          <Button
            colorScheme={isSelected ? "primary" : "gray"}
            rounded={"full"}
            w={["full", "full", "auto"]}
            leftIcon={<Icon as={route.icon} />}
            key={route.name}
            variant={isSelected ? "solid" : "ghost"}
            onClick={onClick}>
            {route.name}
          </Button>
        )
      })}
    </>
  )
}
