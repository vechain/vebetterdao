import { FaGear } from "react-icons/fa6"
import { LuHouse } from "react-icons/lu"
import { PiSquaresFour } from "react-icons/pi"
import { FaUser } from "react-icons/fa"
import { LiaBalanceScaleSolid, LiaChartPieSolid } from "react-icons/lia"

export interface Route {
  name: string
  onClick?: string | (() => void)
  icon?: React.FC
  isVisible?: boolean
  component?: JSX.Element
  description?: string
  subRoutes?: Route[]
}

export const Routes: Route[] = [
  {
    name: "Dashboard",
    onClick: "/",
    isVisible: true,
    icon: LuHouse,
    description: "General overview about your progress, sustainable actions and veBetter news.",
  },
  {
    name: "Apps",
    onClick: "/apps",
    isVisible: true,
    icon: PiSquaresFour,
    description: "Explore apps where you can earn B3TR tokens doing better actions.",
  },
  {
    name: "Allocations",
    onClick: "/rounds",
    isVisible: true,
    icon: LiaChartPieSolid,
    description: "Vote weekly with your VOT3 to assign B3TR funds to your favorite apps.",
  },

  {
    name: "Governance",
    onClick: "/proposals",
    isVisible: true,
    icon: LiaBalanceScaleSolid,
    description: "Create and vote on proposals with your VOT3 tokens to make changes on the ecosystem.",
    subRoutes: [
      {
        name: "Proposals",
        description: "Propose your ideas and let the community decide!",
        onClick: "/proposals",
      },
      {
        name: "Grants",
        description: "Need funding? Apply for a grant and get support",
        onClick: "/proposals/grants",
      },
    ],
  },
  { name: "Profile", onClick: "/profile", isVisible: true, icon: FaUser },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: FaGear },
]
