import React from "react"
import { ProposalState } from "@/api"
import ProposalBadge from "@/components/Proposal/ProposalBadge"
import { FaRegHeart } from "react-icons/fa"
import { MdHowToVote } from "react-icons/md"
import { PiThumbsDownBold, PiThumbsUpBold } from "react-icons/pi"
import { FaCheck } from "react-icons/fa6";
import { IoBan } from "react-icons/io5";


type Props = {
  type: ProposalState
  isDepositReached?: boolean
}

const StatusBadge: React.FC<Props> = ({ type, isDepositReached }) => {
  const getStatusBadge = () => {
    switch (type) {
      case ProposalState.Active:
        return (
          <ProposalBadge
            bgColor="#CDFF9F"
            textColor="rgba(58, 111, 0, 1)"
            icon={<MdHowToVote color="rgba(58, 111, 0, 1)" width="16px" height="16px" />}
            text="Active now"
          />
        )
      case ProposalState.Pending:
        return isDepositReached ? (
          <ProposalBadge
            bgColor="#E0E9FE"
            textColor="rgba(0, 76, 252, 1)"
            icon={<FaRegHeart color="rgba(0, 76, 252, 1)" width="16px" height="16px" />}
            text="Upcoming voting"
          />
        ) : (
          <ProposalBadge
            bgColor="#FFF3E5"
            textColor="rgba(242, 155, 50, 1)"
            icon={<FaRegHeart color="#F29B32" width="16px" height="16px" />}
            text="Looking for support"
          />
        )
      case ProposalState.Defeated:
        return (
          <ProposalBadge
            bgColor="#F8F8F8"
            textColor="rgba(200, 73, 104, 1)"
            icon={<PiThumbsDownBold color="rgba(200, 73, 104, 1)" width="16px" height="16px" />}
            text="Ended and rejected"
          />
        )
      case ProposalState.Succeeded:
        return (
          <ProposalBadge
            bgColor="#EBF1FE"
            textColor="rgba(0, 76, 252, 1)"
            icon={<PiThumbsUpBold color="rgba(0, 76, 252, 1)" width="16px" height="16px" />}
            text="Ended and ready to be queued"
          />
        )
      case ProposalState.Queued:
        return (
          <ProposalBadge
            bgColor="#EBF1FE"
            textColor="rgba(0, 76, 252, 1)"
            icon={<PiThumbsUpBold color="rgba(0, 76, 252, 1)" width="16px" height="16px" />}
            text="Ended and queued"
          />
        )
      case ProposalState.DepositNotMet:
        return (
          <ProposalBadge
            bgColor="#FCEEF1"
            textColor="rgba(210, 63, 99, 1)"
            icon={<FaRegHeart color="rgba(210, 63, 99, 1)" width="16px" height="16px" />}
            text="Support not met"
          />
        )
      case ProposalState.Executed:
        return (
          <ProposalBadge
            bgColor="#E9FDF1"
            textColor="rgba(56, 191, 102, 1)"
            icon={<FaCheck color="rgba(56, 191, 102, 1)" width="16px" height="16px" />}
            text="Ended and executed"
          />
        )
      case ProposalState.Canceled:
        return (
          <ProposalBadge
            bgColor="#FCEEF1"
            textColor="rgba(210, 63, 99, 1)"
            icon={<IoBan color="rgba(210, 63, 99, 1)" width="16px" height="16px" />}
            text="Cancelled"
          />
        )

      default:
        return null
    }
  }

  return <>{getStatusBadge()}</>
}

export default StatusBadge
