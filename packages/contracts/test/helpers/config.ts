import { defineConfig } from "@repo/config/contracts/defineConfig"

export function createTestConfig() {
  return defineConfig({
    NEXT_PUBLIC_APP_ENV: "local",

    B3TR_CAP: 1_000_000_000, // 1B
    B3TR_GOVERNOR_QUORUM_PERCENTAGE: 4, // 4 -> Need 4% of voters to pass
    B3TR_GOVERNOR_MIN_DELAY: 30, //after a vote passes, you have 5 min before you can vote queue the proposal
    B3TR_GOVERNOR_PROPOSAL_THRESHOLD: 1000, // How many votes are needed to create a proposal

    EMISSIONS_CYCLE_DURATION: 12, // 12 blocks - 2 minutes.
    EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE: 4, // 4% decay every cycle
    EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE: 20,
    EMISSIONS_X_ALLOCATION_DECAY_PERIOD: 12,
    EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD: 50,
    EMISSIONS_TREASURY_PERCENTAGE: 2500, // 25%
    EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE: 80,

    X_ALLOCATION_VOTING_QUORUM_PERCENTAGE: 40, // 40 -> Need 40% of total supply to succeed

    X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE: 30, // min amount of X tokens that a project will get each round
    X_ALLOCATION_POOL_APP_SHARES_MAX_CAP: 20, // an app can get max % in allocation round

    CONTRACTS_ADMIN_ADDRESS: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa", //1st account from mnemonic of solo network
    VOTE_2_EARN_POOL_ADDRESS: "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68", //2nd account from mnemonic of solo network

    INITIAL_X_ALLOCATION: BigInt("2000000000000000000000000"), // 2M

    /*
      X/Economic Node => Max Level For Free

      Strength => 2,
      Thunder => 4,
      Mjolnir => 6,
      VeThorX => 2,
      StrengthX => 4,
      ThunderX => 6,
      MjolnirX => 7,
    */
    NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS: [2, 4, 6, 2, 4, 6, 7],

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
    NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL: [
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

    NFT_BADGE_BASE_URI: "ipfs://test/", // IPFS base URI for the NFT Badge

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
  })
}
