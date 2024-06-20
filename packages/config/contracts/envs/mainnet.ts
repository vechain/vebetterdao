import { defineConfig } from "../defineConfig"
export function createMainnetConfig() {
  return defineConfig({
    NEXT_PUBLIC_APP_ENV: "mainnet",

    MIGRATION_ADDRESS: "0x",
    MIGRATION_AMOUNT: BigInt("3750000000000000000000000"), // 3.75 million B3TR tokens from pilot show

    B3TR_GOVERNOR_QUORUM_PERCENTAGE: 51, //Need 51% of voters to pass
    TIMELOCK_MIN_DELAY: 60480, // 1 week, time to wait before you can execute a queued proposa
    B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 2, // Percentage of total B3TR supply needed to be deposited to create a proposal
    B3TR_GOVERNOR_MIN_VOTING_DELAY: 25920, // 3 days, proposal needs to be created at least 3 days before it can be voted on
    B3TR_GOVERNOR_VOTING_THRESHOLD: BigInt("1000000000000000000"), // 1 vote
    /*
      For ambiguous functions (functions with same name), the function signature is used to differentiate them
      e.g., instead of using "setVoterRewards", we use "setVoterRewards(address)"
    */
    B3TR_GOVERNOR_WHITELISTED_METHODS: {
      Treasury: ["transferB3TR"],
    },

    INITIAL_X_ALLOCATION: BigInt("2000000000000000000000000"), // 2M B3TR
    EMISSIONS_CYCLE_DURATION: 60480, // blocks - 60480 blocks - 1 week.
    EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE: 4, // 4% decay every cycle
    EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE: 20, // 20% decay every cycle
    EMISSIONS_X_ALLOCATION_DECAY_PERIOD: 912, // every 12 cycles
    EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD: 50, // every 50 cycles
    EMISSIONS_TREASURY_PERCENTAGE: 2500, // 25% of the emissions go to the treasury
    EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE: 80,

    X_ALLOCATION_VOTING_QUORUM_PERCENTAGE: 40, // 40 -> Need 40% of total supply to succeed
    X_ALLOCATION_VOTING_VOTING_THRESHOLD: BigInt("1000000000000000000"), // 1 vote
    X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE: 30, // % of tokens from each round that are equally distributed to all apps
    X_ALLOCATION_POOL_APP_SHARES_MAX_CAP: 20, // max % votes an app can receive in a round

    CONTRACTS_ADMIN_ADDRESS: "0xE3D511ce183D3C53813BEA223Fe1E51BB9fF14a4",
    VOTE_2_EARN_POOL_ADDRESS: "0xE3D511ce183D3C53813BEA223Fe1E51BB9fF14a4", //temporarily pointing to CONTRACTS_ADMIN_ADDRESS, then updated in the deploy script to point to the voterReward contract

    GM_NFT_BASE_URI: "ipfs://bafybeidngidiqpenmmvnnmxtnxar3stxtnltpknt5tg7jbgt4dkfhkcxha/", // IPFS base URI for the GM NFT
    /*
      Level => B3TR Required
      2 (Moon) => 10,000 B3TR
      3 (Mercury) => 25,000 B3TR
      4 (Venus) => 50,000 B3TR
      5 (Mars) => 100,000 B3TR
      6 (Jupiter) => 250,000 B3TR
      7 (Saturn) => 500,000 B3TR
      8 (Uranus) => 2,500,000 B3TR
      9 (Neptune) => 5,000,000 B3TR
      10 (Galaxy) => 25,000,000 B3TR
    */
    GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL: [
      10000000000000000000000n,
      25000000000000000000000n,
      50000000000000000000000n,
      100000000000000000000000n,
      250000000000000000000000n,
      500000000000000000000000n,
      2500000000000000000000000n,
      5000000000000000000000000n,
      25000000000000000000000000n,
    ],
    VOTER_REWARDS_LEVELS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    /*
      Level => Percentage Multiplier
      2 (Moon) => 10% (1.1x)
      3 (Mercury) => 20% (1.2x)
      4 (Venus) => 50% (1.5x)
      5 (Mars) => 100% (2x)
      6 (Jupiter) => 150% (2.5x)
      7 (Saturn) => 200% (3x)
      8 (Uranus) => 400% (5x)
      9 (Neptune) => 900% (10x)
      10 (Galaxy) => 2400% (25x)
    */
    VOTER_REWARDS_MULTIPLIER: [0, 10, 20, 50, 100, 150, 200, 400, 900, 2400],

    XAPP_BASE_URI: "ipfs://",
    /*
      Token transfer limits. These values are not final and are for testing purposes only.
    */
    TREASURY_TRANSFER_LIMIT_VET: BigInt("200000000000000000000000"), // 200,000 VET
    TREASURY_TRANSFER_LIMIT_B3TR: BigInt("500000000000000000000000"), // 50,000 B3TR
    TREASURY_TRANSFER_LIMIT_VTHO: BigInt("3000000000000000000000000"), // 3,000,000 VTHO
    TREASURY_TRANSFER_LIMIT_VOT3: BigInt("500000000000000000000000"), // 50,000 VOT3
  })
}
