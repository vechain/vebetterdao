import { FaGear, FaScaleBalanced, FaChartPie, FaHouse } from "react-icons/fa6"
import { PiSquaresFourFill } from "react-icons/pi"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
}

export const Routes: Route[] = [
  { name: "Dashboard", onClick: "/", isVisible: true, icon: FaHouse },
  { name: "Apps", onClick: "/apps", isVisible: true, icon: PiSquaresFourFill },
  { name: "Allocations", onClick: "/rounds", isVisible: true, icon: FaChartPie },
  { name: "Governance", onClick: "/proposals", isVisible: true, icon: FaScaleBalanced },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: FaGear },
]
