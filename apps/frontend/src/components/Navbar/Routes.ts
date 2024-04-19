import { FaGear, FaGlobe, FaScaleBalanced, FaChartPie, FaHouse } from "react-icons/fa6"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
}

export const Routes: Route[] = [
  { name: "Dashboard", onClick: "/", isVisible: true, icon: FaHouse },
  { name: "Apps", onClick: "/apps", isVisible: true, icon: FaGlobe },
  { name: "Allocations", onClick: "/rounds", isVisible: true, icon: FaChartPie },
  { name: "Proposals", onClick: "/proposals", isVisible: true, icon: FaScaleBalanced },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: FaGear },
]
