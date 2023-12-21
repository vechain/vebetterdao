import { getNetworkById } from "@repo/constants"

const nodeUrl = process.env.NEXT_PUBLIC_NODE_URL
const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE

const getNodeUrl = () => {
  if (!nodeUrl) {
    throw new Error("NEXT_PUBLIC_NODE_URL is not set")
  }
  return nodeUrl
}
const getNetworkType = () => {
  if (!networkType) {
    throw new Error("NEXT_PUBLIC_NETWORK_TYPE is not set")
  }
  return networkType
}

const getNetwork = () => {
  const network = getNetworkById(getNetworkType())
  if (!network) {
    throw new Error(`network associated with ${getNetworkType()} not found!`)
  }
  return network
}

const getB3trContractAddress = () => {
  const B3TR_CONTRACT = process.env.NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS
  if (!B3TR_CONTRACT) throw new Error("NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS not set")
  return B3TR_CONTRACT
}

export const networkConfig = {
  nodeUrl: getNodeUrl(),
  network: getNetwork(),
  b3trContractAddress: getB3trContractAddress(),
}
