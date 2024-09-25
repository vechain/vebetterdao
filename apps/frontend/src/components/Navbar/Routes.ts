import { FaGear, FaScaleBalanced, FaChartPie, FaHouse, FaUser } from "react-icons/fa6"
import { PiSquaresFourFill } from "react-icons/pi"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
  description?: string
}

export const Routes: Route[] = [
  {
    name: "Dashboard",
    onClick: "/",
    isVisible: true,
    icon: FaHouse,
    description: "General overview about your progress, sustainable actions and veBetter news.",
  },
  {
    name: "Apps",
    onClick: "/apps",
    isVisible: true,
    icon: PiSquaresFourFill,
    description: "Explore apps where you can earn B3TR tokens doing better actions.",
  },
  {
    name: "Allocations",
    onClick: "/rounds",
    isVisible: true,
    icon: FaChartPie,
    description: "Vote weekly with your VOT3 to assign B3TR funds to your favorite apps.",
  },
  {
    name: "Governance",
    onClick: "/proposals",
    isVisible: true,
    icon: FaScaleBalanced,
    description: "Create and vote on proposals with your VOT3 tokens to make changes on the ecosystem.",
  },
  { name: "Profile", onClick: "/profile", isVisible: true, icon: FaUser },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: FaGear },
]
