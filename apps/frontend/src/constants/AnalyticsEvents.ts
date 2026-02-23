export enum ButtonClickProperties {
  // DASHBOARD PAGE EVENTS
  SWAP_TOKENS = "Swap Tokens",
  GET_VOT3 = "Get VOT3",
  GET_B3TR = "Get B3TR",
  CONVERT_NOW = "Convert now",
  SWAP_CONFIRMED = "Swap Confirmed",
  SEE_DETAILS_TX = "See Details Tx",
  // DASHBOARD BANNER EVENTS
  BANNER_VECHAIN_KIT_LAUNCH = "Banner VeChain Kit Launch",
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
  CONTINUE_CREATE_PROPOSAL_ABOUT = "Continue Create Proposal About",
  CONTINUE_CREATE_PROPOSAL_CONTENT = "Continue Create Proposal Content",
  CONTINUE_CREATE_PROPOSAL_ROUND_SELECTION = "Continue Create Proposal Round Selection",
  CONTINUE_CREATE_PROPOSAL_SUPPORT = "Continue Create Proposal Support",
  CREATE_PROPOSAL_SUBMITED = "Create Proposal Submited",
  // JOIN COMMUNITY
  JOIN_COMMUNITY = "Join Community",
  JOIN_DISCORD = "Join Discord",
  JOIN_TELEGRAM = "Join Telegram",
  HELP = "Help",
  //Profile
  EXPLORE_BALANCE_FROM_PROFILE = "Explore Balance From Profile",
  EXPLORE_BETTER_ACTIONS_FROM_PROFILE = "Explore Better Actions From Profile",
  EXPLORE_GOVERNANCE_FROM_PROFILE = "Explore Governance From Profile",
  EXPLORE_GM_FROM_PROFILE = "Explore GM From Profile",
  EXPLORE_NODES_FROM_PROFILE = "Explore Nodes From Profile",
  //GM
  UPGRADING_NOW = "Upgrading GM",
  UPGRADED_GM = "Upgraded GM",
  ATTACHED_GM_TO_XNODE = "Attached GM to XNode",
  ATTACH_NOW = "Attach now",
  ATTACH_AND_UPGRADE_NOW = "Attach and Upgrade now",
  DETACHING_GM_FROM_XNODE = "Detaching GM from XNode",
  DETACHED_GM_FROM_XNODE = "Detached GM from XNode",
}

export const buttonClickActions = (property: ButtonClickProperties) => ({
  action: property,
})

export const buttonClicked: string = "Button Clicked"

export enum LinkClickProperties {
  REDIRECT_TO_APP_PAGE = "Redirect to App Page",
}

export const linkClickActions = (property: LinkClickProperties) => ({
  action: property,
})

export const linkClicked: string = "Link Clicked"

// Appeal/KYC events
export enum SignalResetProperties {
  SIGNAL_RESET_SUCCESS = "Signal Reset Successful",
}

export const signalResetActions = (property: SignalResetProperties) => ({
  action: property,
})

export const signalReset: string = "Signal Reset"

export const signaledAfterKYC: string = "Signaled After KYC"
