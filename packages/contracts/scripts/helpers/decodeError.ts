#!/usr/bin/env ts-node

import fs from "fs"
import path from "path"
import { ethers } from "ethers"
import inquirer from "inquirer"

const CONTRACTS_BASE_PATH = path.resolve(__dirname, "../../artifacts/contracts")

function listAvailableContracts(): string[] {
  const dirs = fs.readdirSync(CONTRACTS_BASE_PATH)
  const contracts: string[] = []

  for (const dir of dirs) {
    const fullDirPath = path.join(CONTRACTS_BASE_PATH, dir)
    if (fs.lstatSync(fullDirPath).isDirectory()) {
      const files = fs.readdirSync(fullDirPath)
      for (const file of files) {
        if (file.endsWith(".json") && !file.includes(".dbg")) {
          contracts.push(file.replace(".json", ""))
        }
      }
    }
  }

  return contracts.sort()
}

function extractSelector(data: string): string {
  const trimmed = data.trim()
  return trimmed.startsWith("0x") ? trimmed.slice(0, 10) : "0x" + trimmed.slice(0, 8)
}

function loadABI(contractName: string): any[] | null {
  const dirs = fs.readdirSync(CONTRACTS_BASE_PATH)
  for (const dir of dirs) {
    const fullDirPath = path.join(CONTRACTS_BASE_PATH, dir)
    const filePath = path.join(fullDirPath, `${contractName}.json`)
    if (fs.existsSync(filePath)) {
      const artifact = JSON.parse(fs.readFileSync(filePath, "utf-8"))
      return artifact.abi
    }
  }

  return null
}

function matchError(selector: string, abi: any[]): string | null {
  const errors = abi.filter(e => e.type === "error")
  for (const err of errors) {
    const inputs = err.inputs as { type: string }[]
    const fullSig = `${err.name}(${inputs.map(i => i.type).join(",")})`
    const sigHash = ethers.id(fullSig).slice(0, 10)
    if (sigHash.toLowerCase() === selector.toLowerCase()) {
      return fullSig
    }
  }
  return null
}

async function main() {
  try {
    const contractChoices = listAvailableContracts()

    const { contractName } = await inquirer.prompt<{ contractName: string }>([
      {
        type: "list",
        name: "contractName",
        message: "📘 Select contract:",
        choices: contractChoices,
      },
    ])

    const { revertData } = await inquirer.prompt<{ revertData: string }>([
      {
        type: "input",
        name: "revertData",
        message: "🔍 Paste revert data (0x...):",
        validate: input =>
          (input.startsWith("0x") && input.length >= 10) || "Must start with 0x and be at least 4 bytes",
      },
    ])

    const selector = extractSelector(revertData)
    console.log(`➡️  Extracted selector: ${selector}`)

    const abi = loadABI(contractName)
    if (!abi) {
      console.error(`❌ ABI not found for contract: ${contractName}`)
      return
    }

    const reason = matchError(selector, abi)
    if (reason) {
      console.log(`✅ Revert reason found: ${reason}`)
    } else {
      console.log("❌ No matching error found in contract ABI.")
    }
  } catch (error) {
    console.error("🚨 Error:", error)
    process.exit(1)
  }
}

main()
