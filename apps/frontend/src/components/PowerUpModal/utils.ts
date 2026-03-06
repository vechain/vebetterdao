export const handleAmountInput = (value: string) =>
  value
    .replaceAll(",", ".")
    .replace(/[^\d\\.]/g, "")
    .replace(/^0+(?=\d)/, "")
    .replace(/^\.(?=\d)/, "0.")
    .replace(/\.(?=.*\.)/g, "")
    .replace(/(\.\d{18})\d+/, "$1")
