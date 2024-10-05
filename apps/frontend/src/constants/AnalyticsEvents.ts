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
  PUBLISH_PROPOSAL = "Publish Proposal",
}

export const buttonClickActions = (property: ButtonClickProperties) => ({
  action: property,
})

export const buttonClicked: string = "Button Clicked"
