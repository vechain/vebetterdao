import { defineConfig } from "../defineConfig"

export function createTestnetConfig() {
  return defineConfig({
    NEXT_PUBLIC_APP_ENV: "testnet",

    B3TR_CAP: 3_750_000, // 3_750_000 -> 3.75 million B3TR tokens for pilot show
    B3TR_GOVERNOR_QUORUM_PERCENTAGE: 4, // 4 -> Need 4% of voters to pass
    B3TR_GOVERNOR_MIN_DELAY: 30, //after a vote passes, you have 5 min before you can vote queue the proposal
    B3TR_GOVERNOR_VOTING_PERIOD: 180, // blocks - how long the vote lasts.
    B3TR_GOVERNOR_VOTING_DELAY: 90, // How many blocks till a proposal vote becomes active
    B3TR_GOVERNOR_PROPOSAL_THRESHOLD: 1000, // How many votes are needed to create a proposal

    EMISSIONS_CYCLE_DURATION: 60480, // blocks - 60480 blocks - 1 week.
    EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE: 4, // 4% decay every cycle
    EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE: 20, // 20% decay every cycle
    EMISSIONS_X_ALLOCATION_DECAY_PERIOD: 999999, // should never decay in pilot show
    EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD: 999999, // should never decay in pilot show
    EMISSIONS_TREASURY_PERCENTAGE: 8750, // 87.5% of the emissions go to the treasury during pilot show
    EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE: 80,

    X_ALLOCATION_VOTING_QUORUM_PERCENTAGE: 40, // 40 -> Need 40% of total supply to succeed

    X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE: 30, // min amount of X tokens that a project will get each round
    X_ALLOCATION_POOL_APP_SHARES_MAX_CAP: 20, // an app can get max % in allocation round

    CONTRACTS_ADMIN_ADDRESS: "0xE3D511ce183D3C53813BEA223Fe1E51BB9fF14a4",
    VOTE_2_EARN_POOL_ADDRESS: "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68", //temporarily pointing to trasury, then updated in the deploy script to point to the voterReward contract

    INITIAL_X_ALLOCATION: BigInt("66666666666666666666666"), // 1M/15 rounded down -> 1/15th of the total supply for pilot show

    NFT_BADGE_BASE_URI: "ipfs://bafybeiahr3qobzujfkxi64o6wrigkmdagrvgfa566rqqth6jm5nq7vf24y/", // IPFS base URI for the NFT Badge

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

    XAPP_BASE_URI: "ipfs://bafybeigsqjh4m3fmy7f7ahpt7uxzfsmcoctjrbxt6kxnejhtnmcn55t2c4/",
  })
}
