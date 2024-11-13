import { APIGatewayProxyResult } from "aws-lambda"
import { StandardApiError, CustomApiError, SuccessResponseType } from "../api.types"

/**
 * Error details for standard API errors with default messages.
 */
export const StandardApiErrorDetails: Record<StandardApiError, { statusCode: number; message: string }> = {
  [StandardApiError.BAD_REQUEST]: { statusCode: 400, message: "Bad request. Please check the submitted data." },
  [StandardApiError.UNAUTHORIZED]: { statusCode: 401, message: "Unauthorized access. Please authenticate." },
  [StandardApiError.FORBIDDEN]: {
    statusCode: 403,
    message: "Forbidden. You do not have permission to access this resource.",
  },
  [StandardApiError.NOT_FOUND]: { statusCode: 404, message: "Resource not found." },
  [StandardApiError.INTERNAL_SERVER_ERROR]: { statusCode: 500, message: "An unexpected error occurred." },
}

/**
 * Error details for custom application-specific errors with default messages.
 */
export const CustomApiErrorDetails: Record<CustomApiError, { statusCode: number; message: string }> = {
  [CustomApiError.INVALID_WALLET_ADDRESS]: { statusCode: 400, message: "Invalid creator wallet address format." },
  [CustomApiError.TRANSACTION_REVERTED]: {
    statusCode: 400,
    message: "The transaction was reverted by the blockchain.",
  },
  [CustomApiError.MINTING_FAILED]: { statusCode: 500, message: "Failed to mint the NFT due to a processing error." },
}

/**
 * Success response details with status codes and default messages.
 */
export const SuccessResponseDetails: Record<SuccessResponseType, { statusCode: number; message: string }> = {
  [SuccessResponseType.SUCCESS]: { statusCode: 200, message: "Request was successful." },
  [SuccessResponseType.RESOURCE_CREATED]: { statusCode: 201, message: "Resource was successfully created." },
}

/**
 * Generic function to build both success and error responses for API Gateway.
 * @param {StandardApiError | CustomApiError | SuccessResponseType} responseType - The type of response.
 * @param {object} [data] - Additional data or details about the response.
 * @returns {APIGatewayProxyResult} - Standardized response for success or error.
 */
export const buildResponse = (
  responseType: StandardApiError | CustomApiError | SuccessResponseType,
  data?: object,
): APIGatewayProxyResult => {
  const responseDetails =
    StandardApiErrorDetails[responseType as StandardApiError] ||
    CustomApiErrorDetails[responseType as CustomApiError] ||
    SuccessResponseDetails[responseType as SuccessResponseType]

  const isError = responseType in StandardApiError || responseType in CustomApiError

  return {
    statusCode: responseDetails.statusCode,
    body: JSON.stringify({
      [isError ? "error" : "data"]: {
        code: responseType,
        message: responseDetails.message,
        ...(data && { details: data }),
      },
    }),
  }
}
