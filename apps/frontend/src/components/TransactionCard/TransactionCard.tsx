import { BetterActionCard } from "./cards/BetterActionCard"
import { ClaimCard } from "./cards/ClaimCard"
import { SupportCard } from "./cards/SupportCard"
import { SwapCard } from "./cards/SwapCard"
import { UpgradeGMCard } from "./cards/UpgradeGMCard"
import { Transaction } from "@/api"
import { ethers } from "ethers"

type Props = {
  transaction: Transaction
}

export const TransactionCard = ({ transaction }: Props) => {
  switch (transaction.eventName) {
    case "B3TR_ACTION": {
      return (
        <BetterActionCard
          amountB3tr={Number(ethers.formatEther(transaction.value ?? 0))}
          appId={transaction.appId}
          blockNumber={transaction.blockNumber}
          blockTimestamp={transaction.blockTimestamp}
          proof={transaction.proof}
        />
      )
    }
    case "B3TR_SWAP_VOT3_TO_B3TR":
      return <SwapCard transaction={transaction} vot3ToB3tr={true} />
    case "B3TR_SWAP_B3TR_TO_VOT3":
      return <SwapCard transaction={transaction} vot3ToB3tr={false} />
    case "B3TR_CLAIM_REWARD":
      return <ClaimCard transaction={transaction} />
    case "B3TR_PROPOSAL_SUPPORT":
      return <SupportCard transaction={transaction} />
    case "B3TR_UPGRADE_GM":
      return <UpgradeGMCard transaction={transaction} />
    default:
      return null
  }
}
