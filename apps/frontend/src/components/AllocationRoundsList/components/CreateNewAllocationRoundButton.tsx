import { useProposeAllocationRound } from "@/hooks"
import { Button } from "@chakra-ui/react"

export const CreateNewAllocationRoundButton: React.FC = () => {
  const { sendTransaction } = useProposeAllocationRound({})
  return <Button onClick={() => sendTransaction(undefined)}>Create new allocation round</Button>
}
