// Mock thor-devkit for Storybook browser environment
export const secp256k1 = {
  generatePrivateKey: () => new Uint8Array(32),
  derivePublicKey: () => new Uint8Array(65),
  sign: () => new Uint8Array(65),
  recover: () => new Uint8Array(65),
}

export const address = {
  toChecksumed: (addr: string) => addr,
  fromPublicKey: () => "0x0000000000000000000000000000000000000000",
}

export const blake2b256 = () => new Uint8Array(32)
export const keccak256 = () => new Uint8Array(32)

export default {
  secp256k1,
  address,
  blake2b256,
  keccak256,
}
