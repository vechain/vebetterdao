export enum Type {
  MINT = "mint",
  TRANSFER = "transfer",
}

export interface Env {
  type: Type
  recipientInputFilePath: string
  batchSize: number
  pk: Buffer
  gasPriceCoef: number
}
