import base from "./mainnet"
import { AppConfig } from "."

const config: AppConfig = {
  ...base,
  basePath: "https://governance.vebetterdao.org",
}

export default config
