const localConfig = {
  b3trContractAddress: "0xcB643cC8aF6853AC0396110D1a93242810729093",
  vot3ContractAddress: "0x42E40b63E948c477b04c539E8064439c883ac8c1",
  nodeUrl: "http://localhost:8669",
  networkType: "solo",
}

const getConfig = () => {
  const networkType = process.env.NETWORK_TYPE
  if (!networkType) throw new Error("NETWORK_TYPE env variable is not set")
  if (networkType === "solo") return localConfig
  throw new Error(`Unsupported NETWORK_TYPE ${networkType}`)
}

export const config = getConfig()
