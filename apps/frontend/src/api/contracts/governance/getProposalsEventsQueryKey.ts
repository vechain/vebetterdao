import { getEventsKey } from "@/hooks"

export const getProposalsEventsQueryKey = () => {
  return [
    ...getEventsKey({ eventName: "ProposalCreated" }),
    ...getEventsKey({ eventName: "ProposalCanceled" }),
    ...getEventsKey({ eventName: "ProposalExecuted" }),
    ...getEventsKey({ eventName: "ProposalQueued" }),
    ...getEventsKey({ eventName: "ProposalDeposit" }),
  ]
}
