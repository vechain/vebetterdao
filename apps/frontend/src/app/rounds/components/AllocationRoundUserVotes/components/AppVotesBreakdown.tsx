import { HStack } from "@chakra-ui/react"

type Props = {
  votes: {
    id: string
    value: number
  }[]
}
export const AppVotesBreakdown = ({ votes }: Props) => {
  console.log("votes", votes)
  const isCompletedAllocated = votes.reduce((acc, vote) => acc + vote.value, 0) >= 100
  return (
    <HStack w="full" borderRadius={"xl"} bg="gray" h={10} spacing={0}>
      {votes.map((vote, index) => (
        <HStack
          {...(index === 0 && { borderLeftRadius: "xl" })}
          {...((index === votes.length - 1 || vote.value === 100) &&
            isCompletedAllocated && { borderRightRadius: "xl" })}
          key={vote.id}
          w={`${vote.value}%`}
          bg={`green.${index + 1}00`}
          justify="space-between"
          h="full"></HStack>
      ))}
    </HStack>
  )
}
