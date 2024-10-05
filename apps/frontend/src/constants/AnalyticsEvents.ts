export enum ButtonClickProperties {
  // DASHBOARD PAGE EVENTS
  SWAP_TOKENS = "Swap Tokens",
  GET_VOT3 = "Get VOT3",
  GET_B3TR = "Get B3TR",
  CONVERT_NOW = "Convert now",
  SWAP_CONFIRMED = "Swap Confirmed",
  SEE_DETAILS_TX = "See Details Tx",

  // VOTES EVENTS
  CASTING_VOTE = "Casting Vote",
  CONTINUE_CASTING_VOTE_SELECTION = "Continue Casting Vote Selection",
  CONTINUE_CASTING_VOTE_PERCENTAGE = "Continue Casting Vote Percentage",
  CONTINUE_CASTING_VOTE_CONFIRM_TX = "Continue Casting Vote Confim Tx",

  // TX EVENTS
  SUCCESS_TX = "SUCCESS_TX",

  // CLAIMING REWARDS
  CLAIM_REWARDS = "Claim Rewards",

  //MINT GM NFT
  CLAIM_NFT = "Claim NFT",

  // PROPOSALS / GOVERNANCE EVENTS
  CREATE_PROPOSAL = "Create Proposal",
  CONTINUE_CREATE_PROPOSAL = "Continue Create Proposal",
  CONTINUE_CREATE_PROPOSAL_TYPE = "Continue Create Proposal Type",

  CONTINUE_CREATE_PROPOSAL_FUNCTIONS = "Continue Create Proposal Functions",
  CONTINUE_CREATE_PROPOSAL_DISCUSSION = "Continue Create Proposal Discussion",

  CONTINUE_CREATE_PROPOSAL_DETAILS = "Continue Create Proposal Details",
  CONTINUE_CREATE_PROPOSAL_CONTENT = "Continue Create Proposal Content",

  CONTINUE_CREATE_PROPOSAL_ROUND_SELECTION = "Continue Create Proposal Round Selection",
  CONTINUE_CREATE_PROPOSAL_SUPPORT = "Continue Create Proposal Support",
  CREATE_PROPOSAL_SUBMITED = "Create Proposal Submited",
  PUBLISHED_PROPOSAL = "Published Proposal",

  // JOIN COMMUNITY
  JOIN_COMMUNITY = "Join Community",
}

export const buttonClickActions = (property: ButtonClickProperties) => ({
  action: property,
})

export const buttonClicked: string = "Button Clicked"
