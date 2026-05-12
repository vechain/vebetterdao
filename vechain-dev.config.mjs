/**
 * Configuration for @vechain/dev-stack — the shared local dev environment
 * (thor-solo + indexer + block-explorer) shared with other VeChain projects.
 *
 * `yarn dev` joins the shared stack: deploys VeBetterDAO contracts to solo,
 * registers their addresses with the stack, restarts the indexer to pick them
 * up, then exec's the frontend dev server.
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
  dev: 'yarn workspace frontend dev',
}
