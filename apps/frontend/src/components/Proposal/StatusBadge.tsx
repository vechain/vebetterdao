import React from "react"
import { Box } from "@chakra-ui/react"
import { ProposalState } from "@/api"
import { UilClock, UilThumbsUp } from "@iconscout/react-unicons"
import ProposalBadge from "@/components/Proposal/ProposalBadge"

type Props = {
  type: ProposalState
}

const StatusBadge: React.FC<Props> = ({ type }) => {
  const getStatusBadge = () => {
    switch (type) {
      case ProposalState.Active:
        return (
          <ProposalBadge
            bgColor="#CDFF9F"
            textColor="#3A6F00"
            icon={<Box bg="#FC0000" w={2} h={2} borderRadius="full" />}
            text="Active now"
          />
        )
      case ProposalState.Pending:
        return (
          <ProposalBadge
            bgColor="#E0E9FE"
            textColor="#004CFC"
            icon={<UilClock color="#F29B32" width="16px" height="16px" />}
            text="Upcoming Voting"
          />
        )
      default:
        return null
    }
  }

  return <>{getStatusBadge()}</>
}

export default StatusBadge
