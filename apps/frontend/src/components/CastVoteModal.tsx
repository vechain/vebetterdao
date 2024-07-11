import { ProposalCreatedEvent, VoteType, useGetVotesOnBlock, useProposalSnapshot } from "@/api"
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
  Box,
  Skeleton,
  useDisclosure,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { FormEvent, useCallback, useState } from "react"
import { MdHowToVote } from "react-icons/md"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"
import { TransactionModal } from "./TransactionModal"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  proposal: ProposalCreatedEvent
}

export const CastVoteModal: React.FC<Props> = ({ isOpen, onOpen, onClose, proposal }) => {
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()
  const onSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const castVoteMutation = useCastVote({
    proposalId: proposal.proposalId,
    onSuccess,
  })

  const onSubmit = useCallback(
    (vote: VoteType, reason?: string) => {
      onClose()
      onConfirmationOpen()
      castVoteMutation.sendTransaction(vote, reason)
    },
    [castVoteMutation, onClose, onConfirmationOpen],
  )

  const onTryAgain = useCallback(() => {
    castVoteMutation.resetStatus()
    onOpen()
  }, [onOpen, castVoteMutation])

  if (castVoteMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Cast your vote"
        successTitle="Vote casted!"
        status={castVoteMutation.error ? "error" : castVoteMutation.status}
        errorDescription={castVoteMutation.error?.reason}
        errorTitle={castVoteMutation.error ? "Error creating proposal" : undefined}
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Casting vote..."
        txId={castVoteMutation.txReceipt?.meta.txID}
        showExplorerButton
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <CastVoteModalContent onVote={onSubmit} proposal={proposal} />
      </ModalContent>
    </Modal>
  )
}

type CastVoteModalFormContentProps = {
  onVote: (vote: VoteType, reason?: string) => void
  proposal: ProposalCreatedEvent
}

const CastVoteModalContent: React.FC<CastVoteModalFormContentProps> = ({ onVote, proposal }) => {
  const { account } = useWallet()
  const { data: proposalSnapshotBlock, isLoading: proposalSnapshotBlockLoading } = useProposalSnapshot(
    proposal.proposalId,
  )
  const { data: votes } = useGetVotesOnBlock(Number(proposalSnapshotBlock), account ?? undefined)
  const [selectedVote, setSelectedVote] = useState<VoteType>(VoteType.VOTE_FOR)
  const [reason, setReason] = useState<string>("")
  const { t } = useTranslation()
  const isDisabled = selectedVote === undefined

  const onSubmit = (e: FormEvent<HTMLElement>) => {
    e.preventDefault()
    if (isDisabled) return
    onVote(selectedVote, reason)
  }

  const suggestedOptions = [
    { label: "Yes", value: VoteType.VOTE_FOR, icon: FaThumbsUp },
    { label: "No", value: VoteType.VOTE_AGAINST, icon: FaThumbsDown },
  ]

  return (
    <form onSubmit={onSubmit}>
      <ModalHeader>{t("Cast your vote")}</ModalHeader>

      <ModalCloseButton />
      <ModalBody>
        <VStack spacing={4} alignItems="stretch">
          <Card px={2} py={4}>
            <VStack spacing={4} alignItems="center" justify="center">
              <Heading as="h3" size="sm">
                {t("Your voting power")}
              </Heading>
              <Box>
                <HStack spacing={2} justify={"center"}>
                  <Icon as={MdHowToVote} fontSize={"2xl"} />
                  <Heading as="h1" size="lg">
                    {votes ?? "0"}
                  </Heading>
                </HStack>
                <Skeleton isLoaded={!proposalSnapshotBlockLoading}>
                  <Text fontSize="xs">
                    {t("Votes snapshotted at block #")}
                    {proposalSnapshotBlock}
                  </Text>
                </Skeleton>
              </Box>
              <Text fontSize="sm" fontWeight={"thin"}>
                {t("You can get more votes by staking more B3TR")}
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
            {t("You can also")}{" "}
            <Button
              variant={"link"}
              onClick={() => setSelectedVote(VoteType.ABSTAIN)}
              colorScheme={selectedVote === VoteType.ABSTAIN ? "blue" : "gray"}>
              {t("abstain")}
            </Button>
          </Text>
          <FormControl>
            <FormLabel>{t("Reason (optional)")}</FormLabel>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} />
            <FormHelperText>{t("Explain why you are voting this way")}</FormHelperText>
          </FormControl>
        </VStack>
      </ModalBody>

      <ModalFooter>
        <Button type="submit" isDisabled={isDisabled}>
          {t("Cast your vote")}
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
