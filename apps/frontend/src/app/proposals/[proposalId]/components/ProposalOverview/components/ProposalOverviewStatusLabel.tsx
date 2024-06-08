import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { Circle, HStack, Text } from "@chakra-ui/react"
import { UilBan, UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalOverviewStatusLabel = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  switch (proposal.state) {
    case ProposalState.Succeeded:
      return (
        <HStack bg="#E9FDF1" rounded={"12px"} px="10px" py="2px">
          <UilCheck color="#6DCB09" size="20px" />
          <Text fontWeight={"600"} color="#6DCB09">
            {t("Approved")}
          </Text>
        </HStack>
      )
    case ProposalState.Canceled:
    case ProposalState.DepositNotMet:
      return (
        <HStack bg="#FCEEF1" py="4px" px="10px" rounded="12px">
          <UilBan color="#D23F63" size="20px" />
          <Text fontWeight={"600"} color="#D23F63">
            {t("Canceled")}
          </Text>
        </HStack>
      )
    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <HStack bg="#E0E9FE" py="4px" px="10px" rounded="12px">
            <UilClockEight color="#004CFC" size="20px" />
            <Text fontWeight={"600"} color="#004CFC">
              {t("Upcoming voting")}
            </Text>
          </HStack>
        )
      }
      return (
        <HStack bg="#FFF3E5" py="4px" px="10px" rounded="12px">
          <Arm />
          <Text fontWeight={"600"} color="#F29B32">
            {t("Looking for support")}
          </Text>
        </HStack>
      )

    case ProposalState.Active:
      return (
        <HStack alignSelf={"flex-start"} bg="#CDFF9F" rounded="12px" px="10px" py="4px">
          <Circle size="8px" bg="#F50000" />
          <Text fontWeight={600} color="#3A6F00">
            {t("Active now!")}
          </Text>
        </HStack>
      )

    case ProposalState.Defeated:
      return (
        <HStack bg="#F8F8F8" rounded={"12px"} px="10px" py="2px">
          <UilThumbsDown color="#D23F63" size="20px" />
          <Text fontWeight={"600"} color="#D23F63">
            {t("Ended and rejected")}
          </Text>
        </HStack>
      )
    case ProposalState.Queued:
      return (
        <HStack rounded={"12px"} bgColor={"#EBF1FE"} px="10px" py="2px">
          <UilThumbsUp color="#004CFC" size="20px" />
          <Text fontWeight={"600"} color="#004CFC">
            {t("Ended and queued")}
          </Text>
        </HStack>
      )
    case ProposalState.Executed:
      return (
        <HStack bg="#E9FDF1" rounded={"12px"} px="10px" py="2px">
          <UilCheck color="#6DCB09" size="20px" />
          <Text fontWeight={"600"} color="#6DCB09">
            {t("Ended and executed")}
          </Text>
        </HStack>
      )
    default:
      return null
  }
}
