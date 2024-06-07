import { ProposalState, useCurrentProposal } from "@/api"
import { AbstainedIcon, VoteIcon } from "@/components"
import { TransactionModal } from "@/components/TransactionModal"
import { useProposalCastVote } from "@/hooks/useProposalCastVote"
import {
  Box,
  Button,
  Card,
  Divider,
  HStack,
  Heading,
  Image,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilInfoCircle, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { FormEvent, useCallback, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const votes = [
  {
    id: "1",
    title: "Vote for",
    icon: <UilThumbsUp color="#38BF66" size={24} />,
  },
  {
    id: "0",
    title: "Vote against",
    icon: <UilThumbsDown color="#D23F63" size={24} />,
  },
  {
    id: "2",
    title: "Abstain",
    icon: <AbstainedIcon size={24} />,
  },
]

const compactFormatter = getCompactFormatter(2)

export const ProposalVote = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()
  const [selectedVote, setSelectedVote] = useState("1")
  const [comment, setComment] = useState("")
  const { isOpen, onClose, onOpen } = useDisclosure()
  const router = useRouter()

  const isPageNotAllowed = proposal.state !== ProposalState.Active || proposal.hasUserVoted

  useLayoutEffect(() => {
    if (isPageNotAllowed) {
      router.replace(`/proposals/${proposal.id}`)
    }
  }, [isPageNotAllowed, proposal.id, router])

  const handleSetSelectedVote = useCallback(
    (value: string) => () => {
      setSelectedVote(value)
    },
    [],
  )

  const handleChangeComment = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value)
  }, [])

  const onSuccess = useCallback(() => {
    router.push(`/proposals/${proposal.id}`)
  }, [proposal.id, router])

  const castVoteMutation = useProposalCastVote({ proposalId: proposal.id, onSuccess })

  const handleClose = useCallback(() => {
    onClose()
    castVoteMutation.resetStatus()
  }, [onClose, castVoteMutation])

  const handleCastVote = useCallback(
    (e?: FormEvent) => {
      onOpen()
      castVoteMutation.sendTransaction({ proposalId: proposal.id, vote: selectedVote, comment })
      e?.preventDefault()
    },
    [castVoteMutation, comment, onOpen, proposal.id, selectedVote],
  )

  if (isPageNotAllowed) {
    return null
  }

  return (
    <Card border="1px solid #D5D5D5" rounded="16px" p="56px" w="full">
      <Stack flexDir={["column", "column", "row"]} gap={12} as="form" onSubmit={handleCastVote}>
        <VStack alignItems={"stretch"} flex={1} gap={4}>
          <Text fontSize="14px" color="#6A6A6A" wordBreak={"break-word"}>
            {proposal.title}
          </Text>
          <Heading>{t("Vote on this proposal")}</Heading>
          <Text color="#6A6A6A">
            {t("Your ")}
            <b>{t("voting power")}</b>
            {t(" will be determined by the amount of VOT3 you had at the time of the snapshot.")}
          </Text>
          <Card rounded="16px" bg="#F8F8F8" p={"24px"}>
            <VStack alignItems={"stretch"} gap={4}>
              <HStack alignItems={"baseline"}>
                <Image h="24px" w="24px" src="/images/vot3-token.png" alt="vot3-token" />
                <Text fontSize={"28px"} fontWeight={700}>
                  {compactFormatter.format(Number(proposal.userVot3OnSnapshot || 0))}
                </Text>
                <Text fontSize={"14px"} fontWeight={600}>
                  {t("VOT3 BALANCE ON SNAPSHOT")}
                </Text>
              </HStack>
              <HStack>
                <Divider />
                <Text flexBasis={"110px"} fontSize={"12px"}>
                  {t("equal to")}
                </Text>
                <Divider />
              </HStack>
              <HStack alignItems={"baseline"}>
                <VoteIcon size={36} color="#004CFC" />
                <Text fontSize={"48px"} fontWeight={700} color="#004CFC">
                  {compactFormatter.format(Number(proposal.userVotingPowerOnSnapshot || 0))}
                </Text>
                <Text fontSize={"14px"} fontWeight={600}>
                  {t("VOTING POWER")}
                </Text>
              </HStack>
              <HStack alignItems={"flex-start"}>
                <Box>
                  <UilInfoCircle size={14} color="#969696" />
                </Box>
                <VStack alignItems={"stretch"}>
                  <Text fontSize={"14px"} color="#6A6A6A" fontWeight={600}>
                    {t("How is the voting power calculated?")}
                  </Text>
                  <Text fontSize={"14px"} color="#6A6A6A" fontWeight={400} as="span">
                    {t(
                      "To aim for the equality and quality of the voting process, we use quadratic voting coso, which divide your total amount of VOT3 for the square root.",
                    )}
                  </Text>
                  <Text fontSize={"14px"} fontWeight={400} as="span" textDecoration={"underline"} color="#004CFC">
                    {t("Learn more")}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>
        </VStack>
        <VStack alignItems={"stretch"} flex={1} gap={6}>
          <Text fontSize={"20px"} fontWeight={700}>
            {t("Select your vote")}
          </Text>
          <RadioGroup onChange={setSelectedVote} value={selectedVote}>
            <VStack alignItems={"stretch"}>
              {votes.map(vote => {
                const selected = vote.id === selectedVote
                return (
                  <Card
                    key={vote.id}
                    onClick={handleSetSelectedVote(vote.id)}
                    rounded={"16px"}
                    p={"24px"}
                    cursor={"pointer"}
                    border={selected ? "1px solid #004CFC" : "1px solid #D5D5D5"}
                    boxShadow={selected ? "0px 0px 16px 0px rgba(0, 76, 252, 0.35)" : undefined}>
                    <HStack justify="space-between">
                      <HStack>
                        {vote.icon}
                        <Text fontSize={"18px"} fontWeight={600}>
                          {vote.title}
                        </Text>
                      </HStack>
                      <Radio value={vote.id}></Radio>
                    </HStack>
                  </Card>
                )
              })}
            </VStack>
          </RadioGroup>
          <Text fontSize={"20px"} fontWeight={700}>
            {t("Add comment")}
          </Text>
          <Textarea resize={"none"} onChange={handleChangeComment} />
          <Button leftIcon={<VoteIcon />} type="submit" variant="primaryAction" w="full">
            {t("Cast your vote")}
          </Button>
        </VStack>
      </Stack>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Vote Completed!"}
        status={castVoteMutation.error ? "error" : castVoteMutation.status}
        errorDescription={castVoteMutation.error?.reason}
        errorTitle={castVoteMutation.error ? "Error voting" : undefined}
        showTryAgainButton
        onTryAgain={handleCastVote}
        pendingTitle="Voting..."
        showSocialButtons
        socialDescriptionEncoded={encodeURIComponent(
          "🔄 Just voted for a proposal on #VeBetterDAO! \n\n🌱 Explore and join us at https://vebetterdao.org.\n\n#VeBetterDAO #Vechain",
        )}
        showExplorerButton
        txId={castVoteMutation.txReceipt?.meta.txID ?? castVoteMutation.sendTransactionTx?.txid}
      />
    </Card>
  )
}
