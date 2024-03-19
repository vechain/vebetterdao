import { BaseContract, Interface } from "ethers"
import { ethers } from "hardhat"

export const deployProxy = async (contractName: string, args: any[]): Promise<BaseContract> => {
  // Deploy the implementation contract
  const Contract = await ethers.getContractFactory(contractName)
  const implementation = await Contract.deploy()
  await implementation.waitForDeployment()

  // Deploy the proxy contract, link it to the implementation and call the initializer
  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy")
  const proxy = await proxyFactory.deploy(
    await implementation.getAddress(),
    getInitializerData(Contract.interface, args),
  )
  await proxy.waitForDeployment()

  // Return an instance of the contract using the proxy address
  return Contract.attach(await proxy.getAddress())
}

export const upgradeProxy = async (
  previousVersionContractName: string,
  newVersionContractName: string,
  proxyAddress: string,
  args: any[] = [],
): Promise<BaseContract> => {
  console.log("Upgrading proxy at address: ", proxyAddress)

  // Deploy the implementation contract
  const Contract = await ethers.getContractFactory(newVersionContractName)
  const implementation = await Contract.deploy()
  await implementation.waitForDeployment()

  const proxyContract = await ethers.getContractAt("ERC1967Proxy", proxyAddress)

  const currentImplementationContract = await ethers.getContractAt(
    previousVersionContractName,
    await proxyContract.getAddress(),
  )

  const tx = await currentImplementationContract.upgradeToAndCall(
    await implementation.getAddress(),
    args.length > 0 ? getInitializerData(Contract.interface, args) : "0x",
  )
  await tx.wait()

  return Contract.attach(proxyAddress)
}

export function getInitializerData(contractInterface: Interface, args: any[]) {
  const initializer = "initialize"
  const fragment = contractInterface.getFunction(initializer)
  if (!fragment) {
    throw new Error(`Contract initializer not found`)
  }
  return contractInterface.encodeFunctionData(fragment, args)
}
