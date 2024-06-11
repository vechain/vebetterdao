import { defineConfig } from "../defineConfig"

export function createSoloStagingConfig() {
  return defineConfig({
    NEXT_PUBLIC_APP_ENV: "solo-staging",

    B3TR_CAP: 3_750_000, // 3_750_000 -> 3.75 million B3TR tokens for pilot show
    B3TR_GOVERNOR_QUORUM_PERCENTAGE: 4, // 4 -> Need 4% of voters to pass
    B3TR_GOVERNOR_MIN_DELAY: 30, //after a vote passes, you have 5 min before you can vote queue the proposal
    B3TR_GOVERNOR_VOTING_PERIOD: 180, // blocks - how long the vote lasts.
    B3TR_GOVERNOR_VOTING_DELAY: 90, // How many blocks till a proposal vote becomes active
    B3TR_GOVERNOR_PROPOSAL_THRESHOLD: 1000, // How many votes are needed to create a proposal

    EMISSIONS_CYCLE_DURATION: 30, // blocks - 30 blocks - 5 minutes.
    EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE: 4, // 4% decay every cycle
    EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE: 20, // 20% decay every cycle
    EMISSIONS_X_ALLOCATION_DECAY_PERIOD: 999999, // should never decay in pilot show
    EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD: 999999, // should never decay in pilot show
    EMISSIONS_TREASURY_PERCENTAGE: 8750, // 87.5% of the emissions go to the treasury during pilot show
    EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE: 80,

    X_ALLOCATION_VOTING_QUORUM_PERCENTAGE: 40, // 40 -> Need 40% of total supply to succeed

    X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE: 30, // min amount of X tokens that a project will get each round
    X_ALLOCATION_POOL_APP_SHARES_MAX_CAP: 20, // an app can get max % in allocation round

    CONTRACTS_ADMIN_ADDRESS: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa", //1st account from mnemonic of solo network
    VOTE_2_EARN_POOL_ADDRESS: "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68", //2nd account from mnemonic of solo network
    TREASURY_POOL_ADDRESS: "0x0f872421dc479f3c11edd89512731814d0598db5", //3rd account from mnemonic of solo network

    INITIAL_X_ALLOCATION: BigInt("66666666666666666666666"), // 1M/15 rounded down -> 1/15th of the total supply for pilot show

    NFT_BADGE_BASE_URI: "ipfs://bafybeiahr3qobzujfkxi64o6wrigkmdagrvgfa566rqqth6jm5nq7vf24y/", // IPFS base URI for the NFT Badge

    XAPP_BASE_URI: "ipfs://bafybeihppjxm7nqx2ypnjtajq2q632mlvwhpmzl6kjeabbq7qnr3e6jhha//",
  })
}
