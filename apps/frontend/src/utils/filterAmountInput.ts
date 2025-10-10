export const filterAmountInput = (
  amount: string,
  options?: {
    maxBalance?: string | number
    maxDecimals?: number
  },
) => {
  let filteredAmount = amount
    .replace(",", ".") // Replace comma with dot
    .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
    .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
  const { maxBalance, maxDecimals = 18 } = options || {}
  if (maxDecimals || maxDecimals === 0) {
    filteredAmount = filteredAmount.replace(/(\.\d{18})\d+/, "$1") // remove digits after 18th decimal
  }
  if (maxBalance) {
    if (Number(filteredAmount) > Number(maxBalance)) {
      return maxBalance.toString()
    }
  }
  return filteredAmount
}
