/**
 * Configuration for @vechain/dev-stack — the shared local dev environment
 * (thor-solo + indexer + block-explorer) shared with other VeChain projects.
 *
 * `yarn dev:up` joins the shared stack: deploys VeBetterDAO contracts to
 * solo, registers their addresses, and restarts the indexer to pick them
 * up. Run `yarn fe:dev` separately to start the frontend.
 */
export default {
  project: 'b3tr',
  profiles: [
    'accounts',
    'b3tr',
    'contracts',
    'delegation',
    'explorer',
    'history',
    'nfts',
    'stargate',
    'token-reward',
    'transactions',
    'transfers',
  ],
  deploy: 'yarn contracts:deploy:local',
}
