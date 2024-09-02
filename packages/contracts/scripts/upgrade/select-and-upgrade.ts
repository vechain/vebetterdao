import inquirer from "inquirer"
import { execSync } from "child_process"

const contractOptions: { [key: string]: { name: string; versions: string[] } } = {
  "Voter Rewards": {
    name: "voter-rewards",
    versions: ["v2"],
  },
  "B3TR Governor": {
    name: "b3tr-governor",
    versions: ["v2"],
  },
  "XAllocation Voting": {
    name: "x-allocation-voting",
    versions: ["v2"],
  },
}

;(async () => {
  try {
    const env = process.env.NEXT_PUBLIC_APP_ENV

    if (!env) {
      throw new Error("Environment variable NEXT_PUBLIC_APP_ENV is not set.")
    }

    // Prompt the user to select a contract to upgrade
    const { contract } = await inquirer.prompt<{ contract: string }>([
      {
        type: "list",
        name: "contract",
        message: "Which contract do you want to upgrade?",
        choices: Object.keys(contractOptions),
      },
    ])

    const selectedContract = contractOptions[contract]

    // Prompt the user to select the version to upgrade to
    const { version } = await inquirer.prompt<{ version: string }>([
      {
        type: "list",
        name: "version",
        message: `Which version do you want to upgrade ${contract} to?`,
        choices: selectedContract.versions,
      },
    ])

    console.log(`Preparing to upgrade ${contract} to version ${version} on ${env}...`)

    // Set the CONTRACT_TO_UPGRADE and CONTRACT_VERSION environment variables
    process.env.CONTRACT_TO_UPGRADE = selectedContract.name
    process.env.CONTRACT_VERSION = version

    // Run the Turbo task for the appropriate environment
    execSync(`turbo run upgrade:contract:${env}`, { stdio: "inherit" })

    console.log("Upgrade complete!")
  } catch (error) {
    console.error("Upgrade failed:", error)
    process.exit(1)
  }
})()
