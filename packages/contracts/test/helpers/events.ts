import { BaseContract } from "ethers"
import { XAllocationPool, XAllocationVoting } from "../../typechain-types"

export const filterEventsByName = (events: any[], eventName: string) => {
  return events.filter(event => event.fragment && event.fragment.name === eventName)
}

export const decodeEvents = (contract: BaseContract, events: any[]) => {
  return events.map(event => {
    return decodeEvent(event, contract)
  })
}

export const decodeEvent = (event: any, contract: BaseContract) => {
  return contract.interface.parseLog({
    topics: event.topics,
    data: event.data,
  })
}

export const parseAlloctionProposalCreatedEvent = (event: any, xAllocationVoting: XAllocationVoting) => {
  const decoded = decodeEvent(event, xAllocationVoting)

  return {
    proposalId: decoded?.args[0],
    proposer: decoded?.args[1],
    voteStart: decoded?.args[2],
    voteEnd: decoded?.args[3],
  }
}

export const parseAllocationVoteCastEvent = (event: any, xAllocationVoting: XAllocationVoting) => {
  const decoded = decodeEvent(event, xAllocationVoting)

  return {
    voter: decoded?.args[0],
    proposalId: decoded?.args[1],
    apps: decoded?.args[2],
    voteWeights: decoded?.args[3],
  }
}

export const parseAppAddedEvent = (event: any, xAllocationPool: XAllocationVoting) => {
  const decoded = decodeEvent(event, xAllocationPool)

  return {
    id: decoded?.args[0],
    address: decoded?.args[1],
  }
}
