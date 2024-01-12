import { addressUtils, mnemonic } from "@vechain/vechain-sdk-core"

const PHRASE = "denial kitchen pet squirrel other broom bar gas better priority spoil cross".split(" ")
export interface TestPk {
  pk: Buffer
  address: string
}

export const getTestKey = (index: number): TestPk => {
  const pk = mnemonic.derivePrivateKey(PHRASE, `${index}`)
  return {
    pk,
    address: addressUtils.fromPrivateKey(pk),
  }
}
