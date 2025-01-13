/**
 * Interface representing information about a clause that caused a revert.
 */
interface RevertInfo {
  /** Index of the clause that reverted */
  index: number
  /** Revert reason */
  reason: string
}

/**
 * Interface representing the result of the multi-call.
 */
interface MultiCallResult {
  /** Array of results from successfully executed clauses */
  results: Connex.VM.Output[]
  /** Indicates if any clause caused a revert */
  reverted: boolean
  /** Information about the clause that caused a revert, if any */
  revertInfo?: RevertInfo
}

/**
 * Executes multiple clauses using Connex in batches of up to 100 clauses.
 * If any clause causes a revert, the execution stops, and the function returns the results up to that point along with revert information.
 *
 * @param {Connex.Thor} thor - The Connex Thorr instance used to execute the clauses.
 * @param {Connex.VM.Clause[]} clauses - Array of clauses to execute.
 * @returns {Promise<MultiCallResult>} An object containing the results and any revert information.
 */
export const getMultiClauseReading = async (
  thor: Connex.Thor,
  clauses: Connex.VM.Clause[],
): Promise<MultiCallResult> => {
  const batchSize = 100
  let allResults: Connex.VM.Output[] = []
  let reverted = false
  let revertInfo: RevertInfo | undefined

  for (let i = 0; i < clauses.length; i += batchSize) {
    const batchClauses = clauses.slice(i, i + batchSize)
    const res = await thor.explain(batchClauses).execute()

    for (let j = 0; j < res.length; j++) {
      const result = res[j] as Connex.VM.Output
      allResults.push(result)
      if (result?.reverted) {
        reverted = true
        revertInfo = {
          index: i + j,
          reason: result.revertReason || "Unknown reason",
        }
      }
    }
  }

  return { results: allResults, reverted, revertInfo }
}
