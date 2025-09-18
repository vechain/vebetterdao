import { VStack } from "@chakra-ui/react"
import { ActivityCalendar } from "./components/ActivityCalendar"
import { useState } from "react"
import { ActivityList } from "./components/ActivityList"
import { YourBetterActionsCard } from "@/app/components/YourBetterActionsCard"
import { useCanUserVote } from "@/api"
import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"

type Props = {
  address: string
}
export const ProfileBetterActions = ({ address }: Props) => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  const { isPerson, isLoading } = useCanUserVote(address)
  return (
    <VStack gap={4} w="full">
      {!isLoading && !isPerson && <CantVoteCard />}
      <YourBetterActionsCard address={address} renderActions={false} />
      {isCalendarView ? (
        <ActivityCalendar address={address} setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList address={address} setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
