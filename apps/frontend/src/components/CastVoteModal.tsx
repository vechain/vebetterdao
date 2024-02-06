import { VoteType, useGetVotes } from "@/api"
import { useCastVote } from "@/hooks"
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Modal,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Text,
  FormHelperText,
  Textarea,
  Card,
  Heading,
  VStack,
  HStack,
  Icon,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FormEvent, useMemo, useState } from "react"
import { ConfirmTransactionModalContent } from "./ConfirmTransactionModalContent"
import { MdHowToVote } from "react-icons/md"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"

type Props = {
  isOpen: boolean
  onClose: () => void
  proposalId: string
}

export const CastVoteModal: React.FC<Props> = ({ isOpen, onClose, proposalId }) => {
  const { account } = useWallet()

  const onSuccess = () => {
    onClose()
  }

  const { sendTransaction, status, sendTransactionError, resetStatus, txReceiptError } = useCastVote({
    proposalId,
    onSuccess,
  })

  const renderContent = useMemo(() => {
    if (status !== "ready")
      return (
        <ConfirmTransactionModalContent
          description={`Cast your vote for proposal ${proposalId}`}
          status={status}
          error={sendTransactionError?.message ?? txReceiptError?.message}
          onSuccess={onSuccess}
          onTryAgain={resetStatus}
        />
      )
    return <CastVoteModalContent onVote={sendTransaction} />
  }, [status, sendTransactionError, txReceiptError, resetStatus, onSuccess])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>{renderContent}</ModalContent>
    </Modal>
  )
}

type RedeemB3trModalFormContentProps = {
  onVote: (vote: VoteType, reason?: string) => void
}

const CastVoteModalContent: React.FC<RedeemB3trModalFormContentProps> = ({ onVote }) => {
  const { account } = useWallet()
  const { data: votes, error } = useGetVotes(account ?? undefined)
  const [selectedVote, setSelectedVote] = useState<VoteType>(VoteType.VOTE_FOR)
  const [reason, setReason] = useState<string>("")

  const isDisabled = selectedVote === undefined

  const onSubmit = (e: FormEvent<HTMLElement>) => {
    e.preventDefault()
    if (isDisabled) return
    onVote(selectedVote, reason)
  }

  console.log("votes", votes, error)

  const suggestedOptions = [
    { label: "Yes", value: VoteType.VOTE_FOR, icon: FaThumbsUp },
    { label: "No", value: VoteType.VOTE_AGAINST, icon: FaThumbsDown },
  ]

  return (
    <form onSubmit={onSubmit}>
      <ModalHeader>Cast your vote</ModalHeader>

      <ModalCloseButton />
      <ModalBody>
        <VStack spacing={4} alignItems="stretch">
          <Card variant="outline" px={2} py={4}>
            <VStack spacing={4} alignItems="center" justify="center">
              <Heading as="h3" size="sm">
                Your voting power
              </Heading>
              <HStack spacing={2}>
                <Icon as={MdHowToVote} fontSize={"2xl"} />
                <Heading as="h1" size="lg">
                  {votes?.formatted ?? "0"}
                </Heading>
              </HStack>
              <Text fontSize="sm" fontWeight={"thin"} color="gray.500">
                You can get more votes by staking more B3TR
              </Text>
            </VStack>
          </Card>
          <VStack spacing={2} alignItems="stretch">
            {suggestedOptions.map(option => (
              <VoteOptionRadio
                key={option.value}
                label={option.label}
                value={option.value}
                icon={option.icon}
                selectedVote={selectedVote}
                setSelectedVote={setSelectedVote}
              />
            ))}
          </VStack>
          <Text fontSize="sm" color="gray.500" textAlign={"center"}>
            You can also{" "}
            <Button
              variant={"link"}
              onClick={() => setSelectedVote(VoteType.ABSTAIN)}
              colorScheme={selectedVote === VoteType.ABSTAIN ? "blue" : "gray"}>
              abstain
            </Button>
          </Text>
          <FormControl>
            <FormLabel>Reason (optional)</FormLabel>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} />
            <FormHelperText>Explain why you are voting this way</FormHelperText>
          </FormControl>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button type="submit" isDisabled={isDisabled}>
          Cast your vote
        </Button>
      </ModalFooter>
    </form>
  )
}

type VoteOptionRadioProps = {
  label: string
  value: VoteType
  icon: React.ComponentType
  selectedVote: VoteType | undefined
  setSelectedVote: (vote: VoteType) => void
}
const VoteOptionRadio = ({ label, value, icon, selectedVote, setSelectedVote }: VoteOptionRadioProps) => {
  const isSelected = selectedVote === value
  return (
    <Button
      variant={isSelected ? "solid" : "outline"}
      colorScheme={isSelected ? "blue" : "gray"}
      onClick={() => setSelectedVote(value)}
      leftIcon={<Icon as={icon} />}
      w="full">
      {label}
    </Button>
  )
}
