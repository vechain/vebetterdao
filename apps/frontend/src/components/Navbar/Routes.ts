import { FaHome, FaChartPie } from "react-icons/fa"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
}

export const Routes: Route[] = [
  { name: "Dashboard", onClick: "/", isVisible: true, icon: FaHome },
  // { name: "Proposals", onClick: "/proposals", isVisible: true, icon: FaScaleBalanced },
  { name: "Allocations", onClick: "/rounds", isVisible: true, icon: FaChartPie },
]
