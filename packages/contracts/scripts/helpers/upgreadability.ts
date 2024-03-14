import { BaseContract, Interface } from "ethers"
import { ethers } from "hardhat"
import TransparentUpgradableProxy from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json"

type DeployProxyResponse = {
  implementationAddress: string
  proxyAddress: string
  contractInstance: BaseContract
}

export const deployProxy = async (
  contractName: string,
  proxyOwnerAddress: string,
  args: any[],
): Promise<DeployProxyResponse> => {
  // Deploy the implementation contract
  const Contract = await ethers.getContractFactory(contractName)
  const implementation = await Contract.deploy()
  await implementation.waitForDeployment()

  // Deploy the proxy contract, link it to the implementation and call the initializer
  const proxyFactory = await ethers.getContractFactory(
    TransparentUpgradableProxy.abi,
    TransparentUpgradableProxy.bytecode,
  )
  const proxy = await proxyFactory.deploy(
    await implementation.getAddress(),
    proxyOwnerAddress,
    getInitializerData(Contract.interface, args),
  )
  await proxy.waitForDeployment()

  // Create an instance of the contract using the proxy address
  const inst = Contract.attach(await proxy.getAddress())

  return {
    implementationAddress: await implementation.getAddress(),
    proxyAddress: await proxy.getAddress(),
    contractInstance: inst,
  }
}

function getInitializerData(contractInterface: Interface, args: any[]) {
  const initializer = "initialize"
  const fragment = contractInterface.getFunction(initializer)
  if (!fragment) {
    throw new Error(`Contract initializer not found`)
  }
  return contractInterface.encodeFunctionData(fragment, args)
}
