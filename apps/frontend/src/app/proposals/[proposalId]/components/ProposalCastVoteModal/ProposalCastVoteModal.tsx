import { BaseModal } from "@/components/BaseModal"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { useProposalCastVote } from "@/hooks/useProposalCastVote"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { Button, Card, Heading, HStack, Icon, RadioGroup, Text, Textarea, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isVoteModalOpen: boolean
  onClose: () => void
  proposalId: string
}
export const ProposalCastVoteModal = ({ isVoteModalOpen, onClose, proposalId }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [comment, setComment] = useState("")

  const voteOptions = useMemo(
    () => [
      {
        id: "1",
        title: "Approve",
        icon: ThumbsUpIcon,
        iconColor: "status.success.primary",
      },
      {
        id: "2",
        title: "Abstain",
        icon: AbstainIcon,
        iconColor: "status.warning.primary",
      },
      {
        id: "0",
        title: "Against",
        icon: ThumbsDownIcon,
        iconColor: "status.error.primary",
      },
    ],
    [],
  )

  const onVoteSuccess = useCallback(() => {
    onClose()
    setSelectedVote(null)
    setComment("")
  }, [onClose])

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
    <BaseModal
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
                      <Icon as={option.icon} color={option.iconColor} boxSize={5} />
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
          variant="primary"
          w="full"
          disabled={!selectedVote || castVoteMutation.isTransactionPending}
          onClick={handleCastVote}>
          {t("Vote")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
