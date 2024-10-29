import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"
import { PendingActions } from "./components/PendingActions"
import { YourBetterActionsCard } from "@/app/components/YourBetterActionsCard"

type Props = {
  address: string
}
export const ProfileBetterActions = ({ address }: Props) => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  return (
    <VStack gap={4} w="full">
      <PendingActions address={address} />
      <YourBetterActionsCard address={address} renderActions={false} />
      {isCalendarView ? (
        <ActivityCalendar address={address} setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList address={address} setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
