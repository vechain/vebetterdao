import { getOrDeployContractInstances } from "./deploy"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

export const endorseApp = async (appId: string, owner: HardhatEthersSigner) => {
  const { x2EarnApps } = await getOrDeployContractInstances({})

  // Create a MjolnirX node holder => score = 100
  await createNodeHolder(7, owner)

  const tx = await x2EarnApps.connect(owner).endorseApp(appId)
  const txReceipt = await tx.wait()

  const event = txReceipt?.logs[0]

  if (!event) throw new Error("No endorsement event found")
}

export const createNodeHolder = async (level: number, owner: HardhatEthersSigner) => {
  const { vechainNodes } = await getOrDeployContractInstances({})

  await vechainNodes.addToken(owner.address, level, false, 0, 0)
}
