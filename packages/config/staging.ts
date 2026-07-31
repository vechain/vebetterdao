import base from "./testnet-staging"
import { AppConfig } from "."

const config: AppConfig = {
  ...base,
  basePath: "https://staging.testnet.governance.vebetterdao.org",
}

export default config
