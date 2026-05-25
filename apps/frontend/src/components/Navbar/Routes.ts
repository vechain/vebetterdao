import { LuHouse, LuLandmark, LuLayoutGrid, LuSettings, LuTrophy, LuUser } from "react-icons/lu"

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
    name: "Home",
    onClick: "/",
    isVisible: true,
    icon: LuHouse,
    description: "General overview about your progress, sustainable actions and veBetter news.",
  },
  {
    name: "Apps",
    onClick: "/apps",
    isVisible: true,
    icon: LuLayoutGrid,
    description: "Explore apps where you can earn B3TR tokens doing better actions.",
    subRoutes: [
      {
        name: "Explore",
        description: "Explore apps where you can earn B3TR tokens doing better actions.",
        onClick: "/apps",
      },
      {
        name: "Allocation Rounds",
        description: "Vote weekly with your VOT3 to assign B3TR funds to your favorite apps.",
        onClick: "/allocations",
      },
      {
        name: "Endorsement",
        description: "Manage your nodes and endorse apps to support the ecosystem.",
        onClick: "/nodes",
      },
    ],
  },
  {
    name: "Governance",
    onClick: "/proposals",
    isVisible: true,
    icon: LuLandmark,
    description: "Create and vote on proposals with your VOT3 tokens to make changes on the ecosystem.",
    subRoutes: [
      {
        name: "Navigators",
        description: "Browse and delegate to professional voting delegates.",
        onClick: "/navigators",
      },
      {
        name: "Proposals",
        description: "Propose your ideas and let the community decide!",
        onClick: "/proposals",
      },
      {
        name: "Grants",
        description: "Need funding? Apply for a grant and get support",
        onClick: "/grants",
      },
      {
        name: "Treasury",
        description: "View community treasury balances and transfers",
        onClick: "/treasury",
      },
    ],
  },
  {
    name: "B3MO Quests",
    onClick: "/b3mo-quests",
    isVisible: true,
    icon: LuTrophy,
  },
  {
    name: "Profile",
    onClick: "/profile",
    isVisible: true,
    icon: LuUser,
    subRoutes: [
      { name: "My Profile", description: "View your profile, activity and stats", onClick: "/profile" },
      { name: "GM", description: "Manage your Galaxy Member NFT for extra rewards", onClick: "/galaxy-member" },
    ],
  },
  { name: "Admin", onClick: "/admin", isVisible: true, icon: LuSettings },
]
