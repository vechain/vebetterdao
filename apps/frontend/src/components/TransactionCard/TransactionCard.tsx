import { BetterActionCard } from "./cards/BetterActionCard/BetterActionCard"

export type TransactionType = "better-action" | "swap" | "claim" | "support" | "gm-upgrade"

type Props = {
  type: TransactionType
  data: any
}
export const TransactionCard = ({ type, data }: Props) => {
  if (type === "better-action") {
    return <BetterActionCard action={data} />
  }
  return null
}
