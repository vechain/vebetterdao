import { ChallengesDataSource } from "../ChallengesDataSource"

/**
 * Placeholder for the future indexer-backed data source.
 * When `/api/v1/b3tr/challenges/*` endpoints become available, implement the
 * `ChallengesDataSource` interface here: each method should map `PaginationArgs`
 * straight to `?page=X&size=Y` and forward the response pagination.
 * The UI layer will switch over by changing only `useChallengesDataSource`.
 */
export const createIndexerChallengesDataSource = (): ChallengesDataSource => {
  const notImplemented = <T>(method: string): Promise<T> =>
    Promise.reject(new Error(`IndexerChallengesDataSource.${method}: not implemented yet`))

  return {
    getNeededActions: () => notImplemented("getNeededActions"),
    getUserChallenges: () => notImplemented("getUserChallenges"),
    getOpenToJoin: () => notImplemented("getOpenToJoin"),
    getWhatOthersAreDoing: () => notImplemented("getWhatOthersAreDoing"),
    getHistory: () => notImplemented("getHistory"),
    getChallengeDetail: () => notImplemented("getChallengeDetail"),
  }
}
