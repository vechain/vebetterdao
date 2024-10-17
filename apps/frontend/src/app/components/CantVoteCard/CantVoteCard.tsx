import { DelegatorAccountCard } from "./components/DelegatorAccountCard"
import { SecondaryAccountCard } from "./components/SecondaryAccountCard"

export const CantVoteCard = () => {
  return (
    <>
      <SecondaryAccountCard />
      <DelegatorAccountCard />
    </>
  )
}
