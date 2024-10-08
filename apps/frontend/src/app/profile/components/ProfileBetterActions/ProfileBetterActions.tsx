import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"
import { PendingActions } from "./components/PendingActions"
import { YourBetterActionsCard } from "@/app/components/YourBetterActionsCard"
import { VotingQualification } from "./components/VotingQualification"
import { PendingDelegationDelegateePOV } from "./components/PendingDelegationDelegateePOV"
import { PendingDelegationDelegatorPOV } from "./components/PendingDelegationDelegatorPOV"
import { CurrentDelegation } from "./components/CurrentDelegation"

export const ProfileBetterActions = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  return (
    <VStack gap={4} w="full">
      <PendingActions />
      <PendingDelegationDelegateePOV />
      <PendingDelegationDelegatorPOV />
      <CurrentDelegation />
      <VotingQualification />
      <YourBetterActionsCard renderActions={false} />
      {isCalendarView ? (
        <ActivityCalendar setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
