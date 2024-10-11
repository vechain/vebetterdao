// import { BaseTxModalPage } from "./baseTxModalPage"
import { Page } from "playwright"
import { BaseTxModal } from "./baseTxModal"

export class TxModalRoundStart extends BaseTxModal {
  constructor(page: Page) {
    super(page, {
      success: "Round started!",
      error: "Error starting round",
      pending: "Starting round...",
    })
  }
}
