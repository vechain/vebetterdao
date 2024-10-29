import { BetterActionCard } from "./cards/BetterActionCard"
import { ClaimCard } from "./cards/ClaimCard"
import { SupportCard } from "./cards/SupportCard"
import { SwapCard } from "./cards/SwapCard"
import { UpgradeGMCard } from "./cards/UpgradeGMCard"
import { B3trTransaction } from "@/api"

type Props = {
  transaction: B3trTransaction
}
export const TransactionCard = ({ transaction }: Props) => {
  switch (transaction.txType) {
    case "B3TR_ACTION": {
      return (
        <BetterActionCard
          amountB3tr={transaction.amountB3TR}
          appId={transaction.appId}
          blockNumber={transaction.blockNumber}
          blockTimestamp={transaction.blockTimestamp}
          proof={transaction.proof}
        />
      )
    }
    case "SWAP":
      return <SwapCard transaction={transaction} />
    case "CLAIM_REWARD":
      return <ClaimCard transaction={transaction} />
    case "PROPOSAL_SUPPORT":
      return <SupportCard transaction={transaction} />
    case "UPGRADE_GM":
      return <UpgradeGMCard transaction={transaction} />
    default:
      return null
  }
}
