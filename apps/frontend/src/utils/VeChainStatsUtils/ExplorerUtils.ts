import { getConfig } from "@repo/config"

export const getExplorerTxLink = (txId?: string): string => {
  const network = getConfig().network.type
  const explorerUrl = getConfig().network.explorerUrl
  if (network === "test") {
    return `${explorerUrl}/transactions/${txId}`
  } else {
    return `${explorerUrl}/transaction/${txId}`
  }
}

export const getExplorerAddressLink = (address?: string): string => {
  const explorerUrl = getConfig().network.explorerUrl
  return `${explorerUrl}/accounts/${address}`
}
