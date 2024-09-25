import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"

export const ProfileBetterActions = () => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  return (
    <VStack>
      {isCalendarView ? (
        <ActivityCalendar setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
