import { RESET_STATUS } from "../constants"

export type ResetStatus = (typeof RESET_STATUS)[keyof typeof RESET_STATUS]
