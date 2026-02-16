import { getConfig } from "@repo/config"

import { useTransactions } from "@/api/indexer/transactions/useTransactions"

const address = getConfig().treasuryContractAddress

export const useTreasuryTransfers = () => {
  return useTransactions(address, {
    eventName: ["TRANSFER_FT"],
    size: 5,
  })
}
