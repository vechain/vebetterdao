export enum Type {
  MINT = "mint",
  TRANSFER = "transfer",
}

export const parseAirdropType = (airdropType: string): Type => {
  const type = Object.values(Type).find(e => e === airdropType)
  if (!type) throw new Error(`Invalid AIRDROP_TYPE: ${airdropType}`)
  return type
}

export interface Env {
  type: Type
  recipientInputFilePath: string
  batchSize: number
  pk: Buffer
  gasPriceCoef: number
  nodeUrl: string
  b3trContractAddress: string
  networkType: string
}

export enum KeyType {
  PRIVATE_KEY = "private key",
  KEYSTORE = "keystore",
}
