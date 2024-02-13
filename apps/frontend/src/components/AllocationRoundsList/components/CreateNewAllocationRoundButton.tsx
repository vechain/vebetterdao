import { useProposeAllocationRound } from "@/hooks"
import { Button, ButtonProps } from "@chakra-ui/react"

type Props = ButtonProps
export const CreateNewAllocationRoundButton: React.FC<Props> = ({ ...props }) => {
  const { sendTransaction } = useProposeAllocationRound({})
  return (
    <Button onClick={() => sendTransaction(undefined)} {...props}>
      Create new allocation round
    </Button>
  )
}
