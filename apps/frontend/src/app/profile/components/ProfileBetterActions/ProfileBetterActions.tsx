import { VStack } from "@chakra-ui/react"
import { useState } from "react"

import { CantVoteCard } from "@/app/components/CantVoteCard/CantVoteCard"
import { OnboardingCard } from "@/app/components/OnboardingCard/OnboardingCard"
import { YourBetterActionsCard } from "@/app/components/YourBetterActionsCard"

import { useCanUserVote } from "../../../../api/contracts/governance/hooks/useCanUserVote"

import { ActivityCalendar } from "./components/ActivityCalendar/ActivityCalendar"
import { ActivityList } from "./components/ActivityList"

type Props = {
  address: string
}
export const ProfileBetterActions = ({ address }: Props) => {
  const [isCalendarView, setIsCalendarView] = useState(true)
  const { isPerson, isLoading } = useCanUserVote(address)
  return (
    <VStack gap={4} w="full">
      {!isLoading && !isPerson && <CantVoteCard />}
      {!isLoading && !isPerson && <OnboardingCard />}
      <YourBetterActionsCard address={address} renderActions={false} />
      {isCalendarView ? (
        <ActivityCalendar address={address} setIsCalendarView={setIsCalendarView} />
      ) : (
        <ActivityList address={address} setIsCalendarView={setIsCalendarView} />
      )}
    </VStack>
  )
}
