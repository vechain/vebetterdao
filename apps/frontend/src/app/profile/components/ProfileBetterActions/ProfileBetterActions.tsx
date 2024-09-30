import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"
import { PendingActions } from "./components/PendingActions"
import { YourBetterActionsSummary } from "./components/YourBetterActionsSummary"

export const ProfileBetterActions = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  return (
    <VStack gap={4}>
      <PendingActions />
      <YourBetterActionsSummary />
      {isCalendarView ? (
        <ActivityCalendar setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
