/**
 * Utility type to ensure required fields stay required after spreading
 * This helps maintain type safety when merging objects with partial data
 */
export type EnsureRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Query key factory for enriched proposals cache
 * Provides a consistent cache key for React Query
 */
export const getEnrichedProposalsQueryKey = () => ["enriched-proposals"] as const
