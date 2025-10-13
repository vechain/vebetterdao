import { BaseModal } from "@/components/BaseModal"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { useProposalCastVote } from "@/hooks/useProposalCastVote"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { Button, Heading, HStack, Icon, RadioCard, Text, Textarea, VStack } from "@chakra-ui/react"
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
        iconColor: "status.positive.primary",
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
        iconColor: "status.negative.primary",
      },
    ],
    [],
  )

  const castVoteMutation = useProposalCastVote({
    proposalId,
    onSuccess: () => {
      onClose()
      castVoteMutation.resetStatus()
      setSelectedVote(null)
      setComment("")
    },
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
        <Text textStyle="sm" color="text.subtle">
          {" Select your vote"}
        </Text>

        <RadioCard.Root onValueChange={e => setSelectedVote(e.value)} value={selectedVote} colorPalette="blue">
          <VStack gap="3" align="stretch">
            {voteOptions.map(item => (
              <RadioCard.Item
                key={item.id}
                value={item.id}
                rounded="xl"
                borderColor={item.id === selectedVote ? "none" : "border.emphasized"}>
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemText as={HStack} gap="3" textStyle="md" color="text.default">
                    <Icon as={item.icon} color={item.iconColor} boxSize={5} />
                    {item.title}
                  </RadioCard.ItemText>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>
            ))}
          </VStack>
        </RadioCard.Root>

        {/* Comment Section */}
        <VStack align="stretch" gap={2}>
          <Text>{"Comment"}</Text>
          <Text textStyle="sm" color="gray.500">
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
