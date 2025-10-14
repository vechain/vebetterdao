import { RESET_STATUS } from "../constants/resetStatus"

export type ResetStatus = (typeof RESET_STATUS)[keyof typeof RESET_STATUS]
