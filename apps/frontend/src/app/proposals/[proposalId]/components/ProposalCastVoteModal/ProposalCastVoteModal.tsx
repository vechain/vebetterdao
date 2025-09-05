import { AbstainedIcon, RegularModal } from "@/components"
import { VStack, Heading, RadioGroup, Card, HStack, Textarea, Button, Text } from "@chakra-ui/react"
import { t } from "i18next"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { UilThumbsUp, UilThumbsDown } from "@iconscout/react-unicons"
import { useCallback, useMemo, useState } from "react"
import { useProposalCastVote } from "@/hooks/useProposalCastVote"

type Props = {
  isVoteModalOpen: boolean
  onClose: () => void
  proposalId: string
}
export const ProposalCastVoteModal = ({ isVoteModalOpen, onClose, proposalId }: Props) => {
  const { isTxModalOpen } = useTransactionModal()
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  const voteOptions = useMemo(
    () => [
      {
        id: "1",
        title: "Approve",
        icon: <UilThumbsUp color="#38BF66" size={20} />,
      },
      {
        id: "2",
        title: "Abstain",
        icon: <AbstainedIcon size={20} />,
      },
      {
        id: "0",
        title: "Against",
        icon: <UilThumbsDown color="#D23F63" size={20} />,
      },
    ],
    [],
  )

  const onVoteSuccess = useCallback(() => {
    onClose()
    setSelectedVote(null)
    setComment("")
  }, [])

  const castVoteMutation = useProposalCastVote({
    proposalId,
    onSuccess: onVoteSuccess,
  })

  const handleCastVote = useCallback(() => {
    if (!selectedVote) return
    castVoteMutation.sendTransaction({
      proposalId,
      vote: selectedVote,
      comment,
    })
  }, [castVoteMutation, selectedVote, comment, proposalId])
  return (
    <RegularModal
      size="md"
      showCloseButton
      isCloseable
      ariaTitle="Vote on this grant"
      isOpen={isVoteModalOpen && !isTxModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={6}>
        {/* Modal Header */}
        <Heading size="lg">{"Vote on this grant"}</Heading>
        <Text fontSize="sm" color="gray.600">
          {" Select your vote"}
        </Text>

        {/* Vote Options */}
        <RadioGroup.Root onValueChange={e => setSelectedVote(e.value)} value={selectedVote}>
          <VStack align="stretch" gap={3}>
            {voteOptions.map(option => {
              const isSelected = option.id === selectedVote
              return (
                <Card.Root
                  key={option.id}
                  cursor="pointer"
                  p={4}
                  border={isSelected ? "2px solid" : "1px solid"}
                  borderColor={isSelected ? "blue.500" : "gray.200"}
                  bg={isSelected ? "blue.50" : "white"}
                  _hover={{ borderColor: "blue.300" }}
                  onClick={() => setSelectedVote(option.id)}>
                  <HStack justify="space-between">
                    <HStack gap={3}>
                      {option.icon}
                      <Text fontWeight="medium">{option.title}</Text>
                    </HStack>
                    <RadioGroup.Item value={option.id}>
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                    </RadioGroup.Item>
                  </HStack>
                </Card.Root>
              )
            })}
          </VStack>
        </RadioGroup.Root>

        {/* Comment Section */}
        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">{"Comment"}</Text>
          <Text fontSize="sm" color="gray.500">
            {"Optional"}
          </Text>
          <Textarea
            placeholder="I think is a really cool project which will help to the environment and will increase the transactions into the ecosystem"
            value={comment}
            onChange={e => setComment(e.target.value)}
            resize="none"
            rows={4}
          />
        </VStack>

        {/* Vote Button */}
        <Button
          variant="primaryAction"
          w="full"
          disabled={!selectedVote || castVoteMutation.isTransactionPending}
          onClick={handleCastVote}>
          {t("Vote")}
        </Button>
      </VStack>
    </RegularModal>
  )
}
