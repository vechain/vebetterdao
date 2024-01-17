import { Config } from "@repo/config"

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
  config: Config
}

export enum KeyType {
  PRIVATE_KEY = "pk",
  KEYSTORE = "keystore",
}
