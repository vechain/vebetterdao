import inquirer from "inquirer"
import { spawn } from "child_process"

interface SelectDeploy {
  name: string
  description: string
}

const selectDeployConfigs: Record<string, SelectDeploy> = {
  "Deploy All": {
    name: "deploy-all",
    description: "Deploy all contracts in the project",
  },
  "VeBetter Passport": {
    name: "ve-better-passport",
    description: "Deploy only this contract",
  },
  "X2Earn Creator": {
    name: "x2-earn-creator",
    description: "Deploy only this contract",
  },
  "Node Management": {
    name: "node-management",
    description: "Deploy only this contract",
  },
  "X2Earn Rewards Pool": {
    name: "x2-earn-rewards-pool",
    description: "Deploy only this contract",
  },
} as const

type DeploymentOption = (typeof selectDeployConfigs)[keyof typeof selectDeployConfigs]["name"]

function isValidDeploymentOption(option: string): option is DeploymentOption {
  return Object.values(selectDeployConfigs).some(config => config.name === option)
}

interface DeploymentConfig {
  command: string
  args: string[]
}

function getDeploymentConfig(option: DeploymentOption, env: string): DeploymentConfig {
  if (option === "deploy-all") {
    return {
      command: "turbo",
      args: ["run", `deploy:${env}`],
    }
  }
  return {
    command: "turbo",
    args: ["run", `deploy:contract:${env}`],
  }
}

function validateEnvironment(env: string | undefined): asserts env is string {
  if (!env) {
    throw new Error("Environment variable NEXT_PUBLIC_APP_ENV is not set.")
  }
  if (!["local", "testnet-staging", "testnet", "mainnet"].includes(env)) {
    throw new Error("Invalid environment specified")
  }
}

async function executeDeployment(deployChoice: DeploymentOption, env: string): Promise<void> {
  console.log(`Deploying ${deployChoice}`)

  // Set environment variable if needed (not for deploy-all)
  if (deployChoice !== "deploy-all") {
    process.env.CONTRACT_TO_DEPLOY = deployChoice
  }

  const config = getDeploymentConfig(deployChoice, env)

  return new Promise((resolve, reject) => {
    const deployProcess = spawn(config.command, config.args, {
      stdio: "inherit",
      shell: false,
    })

    deployProcess.on("error", error => {
      reject(new Error(`Deployment failed: ${error.message}`))
    })

    deployProcess.on("exit", code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Deployment failed with code ${code}`))
      }
    })
  })
}

async function upgradeContract() {
  try {
    const env = process.env.NEXT_PUBLIC_APP_ENV
    validateEnvironment(env)

    console.log("Deploying contracts on", env)

    // Format choices for inquirer while preserving the original structure
    const deployChoices = Object.entries(selectDeployConfigs).map(([key, value]) => ({
      name: `${key} - ${value.description}`,
      value: value.name,
    }))

    // Prompt the user to select contracts to deploy
    const userChoice = await inquirer.prompt<{ deploy: string }>({
      type: "list",
      name: "deploy",
      message: "Which contracts do you want to deploy?",
      choices: deployChoices,
    })

    // Validate the user's choice
    if (!isValidDeploymentOption(userChoice.deploy)) {
      throw new Error("Invalid deployment option selected")
    }

    // Execute the deployment
    await executeDeployment(userChoice.deploy, env)

    console.log("\nDeploy complete!")
  } catch (error) {
    console.error("Deploy failed:", error)
    process.exit(1)
  }
}

upgradeContract()
