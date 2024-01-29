export * from "./accessControl"
export * from "./b3tr"
export * from "./vot3"

export type TokenBalance = {
  original: string
  scaled: string
  formatted: string
}

export type TokenDetails = {
  name: string
  symbol: string
  decimals: number
  circulatingSupply: string
  totalSupply: string
}
