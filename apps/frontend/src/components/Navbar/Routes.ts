import { FaHome, FaChartPie } from "react-icons/fa"
import { FaGear } from "react-icons/fa6"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
}

export const Routes: Route[] = [
  { name: "Dashboard", onClick: "/", isVisible: false, icon: FaHome },
  // { name: "Proposals", onClick: "/proposals", isVisible: true, icon: FaScaleBalanced },
  { name: "Allocations", onClick: "/rounds", isVisible: true, icon: FaChartPie },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: FaGear },
]
