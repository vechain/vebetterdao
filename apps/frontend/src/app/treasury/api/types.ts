export type TreasuryTransferCategory = "emission" | "surplus" | "gm_upgrade" | "grant" | "out" | "other"

export type TreasuryTransfer = {
  id: string
  txId: string
  blockTimestamp: number
  from: string
  to: string
  value: string
  category: TreasuryTransferCategory
  label: string
  counterpartyName: string | null
}

export type TreasuryTransfersResponse = {
  data: TreasuryTransfer[]
  pagination: { hasNext: boolean }
}
