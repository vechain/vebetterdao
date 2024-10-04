import { BetterActionCard } from "./cards/BetterActionCard/BetterActionCard"
import { ClaimCard } from "./cards/ClaimCard"
import { SupportCard } from "./cards/SupportCard"
import { SwapCard } from "./cards/SwapCard"
import { UpgradeGMCard } from "./cards/UpgradeGMCard"

export type TransactionType = "better-action" | "swap" | "claim" | "support" | "gm-upgrade"

type Props = {
  type: TransactionType
  data: any
}
export const TransactionCard = ({ type, data }: Props) => {
  switch (type) {
    case "better-action":
      return <BetterActionCard action={data} />
    case "swap":
      return <SwapCard data={data} />
    case "claim":
      return <ClaimCard data={data} />
    case "support":
      return <SupportCard data={data} />
    case "gm-upgrade":
      return <UpgradeGMCard data={data} />
    default:
      return null
  }
}
