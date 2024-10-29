import { Page } from "playwright"
import { BaseTxModal } from "./baseTxModal"

export class TxModalVoteCast extends BaseTxModal {
  constructor(page: Page) {
    super(page, {
      success: "Vote Cast!",
      error: "Error casting vote",
      pending: "Sending Transaction...",
    })
  }
}
