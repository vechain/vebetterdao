import { addressUtils, mnemonic } from "@vechain/vechain-sdk-core"

// The PK for the test account with MINT permissions (0x435933c8064b4Ae76bE665428e0307eF2cCFBD68):
// 7b067f53d350f1cf20ec13df416b7b73e88a1dc7331bc904b92108b1e76a08b1
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
