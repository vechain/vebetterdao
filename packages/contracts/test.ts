import { execSync } from "child_process"

let errorOccurred = false

try {
  console.log("Starting service...")
  execSync("yarn start-solo")
  console.log("Waiting for service to start...")
  execSync("sleep 5")
  console.log("Running tests...")
  execSync("npx hardhat test", { stdio: "inherit" })
} catch (error) {
  console.error("Error running tests:", error)
  errorOccurred = true
} finally {
  console.log("Stopping service...")
  execSync("yarn stop-solo")
  process.exit(errorOccurred ? 1 : 0)
}
