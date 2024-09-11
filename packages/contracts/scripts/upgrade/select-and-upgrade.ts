import inquirer from "inquirer"
import { execSync } from "child_process"
import { upgradeConfig } from "./upgradesConfig"

async function upgradeContract() {
  try {
    const env = process.env.NEXT_PUBLIC_APP_ENV
    if (!env) throw new Error("Environment variable NEXT_PUBLIC_APP_ENV is not set.")

    // Prompt the user to select a contract to upgrade
    const { contract } = await inquirer.prompt<{ contract: keyof typeof upgradeConfig }>({
      type: "list",
      name: "contract",
      message: "Which contract do you want to upgrade?",
      choices: Object.keys(upgradeConfig),
    })

    const selectedContract = upgradeConfig[contract]

    const versionChoices = selectedContract.versions.map(version => ({
      name: `${version} - ${selectedContract.descriptions[version]}`,
      value: version,
    }))

    // Prompt the user to select the version to upgrade to
    const { version } = await inquirer.prompt<{ version: string }>({
      type: "list",
      name: "version",
      message: `Which version do you want to upgrade ${contract} to?`,
      choices: versionChoices,
    })

    console.log(`Preparing to upgrade ${contract} to version ${version} on ${env}...`)

    // Set environment variables
    process.env.CONTRACT_TO_UPGRADE = selectedContract.name
    process.env.CONTRACT_VERSION = version

    // Run the upgrade script
    execSync(`turbo run upgrade:contract:${env}`, { stdio: "inherit" })

    console.log("Upgrade complete!")
  } catch (error) {
    console.error("Upgrade failed:", error)
    process.exit(1)
  }
}

upgradeContract()
