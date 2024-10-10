import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"
import { PendingActions } from "./components/PendingActions"
import { YourBetterActionsCard } from "@/app/components/YourBetterActionsCard"

export const ProfileBetterActions = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  return (
    <VStack gap={4} w="full">
      <PendingActions />
      <YourBetterActionsCard renderActions={false} />
      {isCalendarView ? (
        <ActivityCalendar setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
