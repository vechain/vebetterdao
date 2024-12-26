import inquirer from "inquirer"
import { spawnSync } from "child_process"
import path from "path"

const testFiles: Record<string, string> = {
  "Test XApps": "test/XApps.test.ts",
  "Test XAllocationVoting": "test/XAllocationPool.test.ts",
  "Test X2EarnRewardsPool": "test/X2EarnRewardsPool.test.ts",
  "Test X2EarnCreator": "test/X2EarnCreator.test.ts",
  "Test VeBetterPassport": "test/VeBetterPassport.test.ts",
  "Test VoterRewards": "test/VoterRewards.test.ts",
  "Test GalaxyMember": "test/GalaxyMember.test.ts",
  "Test NodeManagement": "test/NodeManagement.test.ts",
  "Test Emissions": "test/Emissions.test.ts",
  "Test Gouvernance": "test/NodeManageent.test.ts",
  "Test TimeLock": "test/TimeLock.test.ts",
  "Test Treasury": "test/Treasury.test.ts",
  "Test B3TR": "test/B3TR.test.ts",
  "Test VOT3": "test/VOT3.test.ts",
}

async function selectAndTest() {
  try {
    const env = process.env.NEXT_PUBLIC_APP_ENV
    if (!env) throw new Error("Environment variable NEXT_PUBLIC_APP_ENV is not set.")

    // Validate environment
    const validEnvs = ["local"]
    if (!validEnvs.includes(env)) {
      throw new Error(`Invalid environment: ${env}`)
    }

    console.log("Running tests in environment:", env)

    // Create choices for the inquirer prompt
    const testChoices = Object.entries(testFiles).map(([key, value]) => ({
      name: key,
      value: value,
    }))

    // Prompt the user to select a test file
    const userChoice = await inquirer.prompt<{ testFile: string }>({
      type: "list",
      name: "testFile",
      message: "Which test file do you want to run?",
      choices: testChoices,
    })

    // Validate test file path
    const testFilePath = path.resolve(userChoice.testFile)
    if (!testFilePath.startsWith(path.resolve("test/"))) {
      throw new Error("Invalid test file path")
    }

    console.log(`Running tests in ${userChoice.testFile}...`)
    const rootDir = path.resolve(process.cwd(), "../..")
    const turboPath = path.join(rootDir, "node_modules", ".bin", "turbo")

    const result = spawnSync(turboPath, ["run", "test:hardhat", "--filter=contracts", "--", userChoice.testFile], {
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        NEXT_PUBLIC_APP_ENV: env,
      },
    })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`)
    }

    console.log("\nTest complete!")
  } catch (error) {
    console.error("Test failed:", error)
    process.exit(1)
  }
}

selectAndTest()
