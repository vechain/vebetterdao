import { FaHome } from "react-icons/fa"
import { FaScaleBalanced } from "react-icons/fa6"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
}

export const Routes: Route[] = [
  { name: "Dashboard", onClick: "/", isVisible: true, icon: FaHome },
  { name: "Proposals", onClick: "/proposals", isVisible: true, icon: FaScaleBalanced },
]
