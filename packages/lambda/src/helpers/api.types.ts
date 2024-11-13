/**
 * Enum for standard API errors.
 */
export enum StandardApiError {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Enum for custom application-specific errors.
 */
export enum CustomApiError {
  INVALID_WALLET_ADDRESS = "INVALID_WALLET_ADDRESS",
  TRANSACTION_REVERTED = "TRANSACTION_REVERTED",
  MINTING_FAILED = "MINTING_FAILED",
}

/**
 * Enum for success responses.
 */
export enum SuccessResponseType {
  SUCCESS = "SUCCESS",
  RESOURCE_CREATED = "RESOURCE_CREATED",
}
