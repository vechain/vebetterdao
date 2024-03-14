import { BaseContract, Interface } from "ethers"
import { ethers } from "hardhat"
import ERC1967Proxy from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json"

export const deployProxy = async (contractName: string, args: any[]): Promise<BaseContract> => {
  // Deploy the implementation contract
  const Contract = await ethers.getContractFactory(contractName)
  const implementation = await Contract.deploy()
  await implementation.waitForDeployment()

  // Deploy the proxy contract, link it to the implementation and call the initializer
  const proxyFactory = await ethers.getContractFactory(ERC1967Proxy.abi, ERC1967Proxy.bytecode)
  const proxy = await proxyFactory.deploy(
    await implementation.getAddress(),
    getInitializerData(Contract.interface, args),
  )
  await proxy.waitForDeployment()

  // Return an instance of the contract using the proxy address
  return Contract.attach(await proxy.getAddress())
}

function getInitializerData(contractInterface: Interface, args: any[]) {
  const initializer = "initialize"
  const fragment = contractInterface.getFunction(initializer)
  if (!fragment) {
    throw new Error(`Contract initializer not found`)
  }
  return contractInterface.encodeFunctionData(fragment, args)
}
