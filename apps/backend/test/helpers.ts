import { Certificate, address, blake2b256, secp256k1 } from "thor-devkit"

export const buildCertificate = () => {
  return buildCertificateWithTimestamp(Date.now().valueOf())
}

export const buildCertificateWithTimestamp = (timestamp: number) => {
  // Generate a private key and address for the signer
  const privateKey = secp256k1.generatePrivateKey()
  const publicKey = secp256k1.derivePublicKey(privateKey)
  const signerAddress = address.fromPublicKey(publicKey)

  // Create a certificate
  const cert: Certificate = {
    purpose: "identification",
    payload: {
      type: "text",
      content: "fyi",
    },
    domain: "localhost",
    timestamp: timestamp,
    signer: signerAddress,
  }

  // Sign certificate
  const jsonStr = Certificate.encode(cert)
  const signature = secp256k1.sign(blake2b256(jsonStr), privateKey)

  // Add 0x to signature
  cert.signature = "0x" + signature.toString("hex")

  return cert
}
