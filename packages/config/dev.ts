import base from "./testnet"
import { AppConfig } from "."

const config: AppConfig = {
  ...base,
  basePath: "https://dev.testnet.governance.vebetterdao.org",
}

export default config
