import { ProposalState, useUserSingleProposalVoteEvent, useIsQuadraticVotingDisabled } from "@/api"
import { AbstainedIcon, VoteIcon } from "@/components"
import { useProposalCastVote } from "@/hooks/useProposalCastVote"
import {
  Box,
  Button,
  Card,
  Separator,
  HStack,
  Heading,
  Image,
  RadioGroup,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { FormEvent, useCallback, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"
import Link from "next/link"

const QUADRATIC_DOCS_URL = "https://vechain-foundation-san-marino.gitbook.io/vebetter-dao/governance#quadratic-voting"

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

type Props = {
  proposalId: string
}
export const ProposalVote = ({ proposalId }: Props) => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const router = useRouter()
  const { account } = useWallet()
  const { data: isQuadraticVotingDisabled } = useIsQuadraticVotingDisabled()

  const { data: userVote } = useUserSingleProposalVoteEvent(proposalId)

  const isPageNotAllowed = proposal.state !== ProposalState.Active || !!userVote || !account?.address

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

  const handleCastVote = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault()
      if (!selectedVote) {
        return
      }
      castVoteMutation.sendTransaction({ proposalId: proposal.id, vote: selectedVote, comment })
    },
    [castVoteMutation, comment, proposal.id, selectedVote],
  )

  if (isPageNotAllowed) {
    return null
  }

  return (
    <Card.Root variant={"baseWithBorder"} w="full">
      <Card.Body>
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
            <Card.Root rounded="16px" bg="dark-contrast-on-card-bg" p={"24px"}>
              <VStack alignItems={"stretch"} gap={4}>
                <Stack
                  gap={[0, 0, 2]}
                  alignItems={"baseline"}
                  direction={["column", "column", "row"]}
                  align={["flex-start", "flex-start", "center"]}>
                  <Image h="24px" w="24px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
                  <Text fontSize={"28px"}>{compactFormatter.format(Number(proposal.userVot3OnSnapshot || 0))}</Text>
                  <Text fontSize={"14px"} fontWeight={600}>
                    {t("VOT3 BALANCE ON SNAPSHOT")}
                  </Text>
                </Stack>

                {!isQuadraticVotingDisabled && ( // Show "equal to" only when quadratic voting is disabled
                  <HStack w="full" justify="center">
                    <Separator flex={0.8} />
                    <Text fontSize={"12px"}>{t("equal to")}</Text>
                    <Separator flex={0.8} />
                  </HStack>
                )}

                {!isQuadraticVotingDisabled && ( // Conditionally render voting power and related information when quadratic voting is enabled
                  <>
                    <Stack
                      gap={[0, 0, 2]}
                      alignItems={"baseline"}
                      direction={["column", "column", "row"]}
                      align={["flex-start", "flex-start", "center"]}>
                      <VoteIcon boxSize={"36px"} color="#004CFC" />
                      <Text fontSize={"36px"} color="#004CFC">
                        {compactFormatter.format(Number(proposal.userVotingPowerOnSnapshot || 0))}
                      </Text>
                      <Text fontSize={"14px"} fontWeight={600}>
                        {t("VOTING POWER")}
                      </Text>
                    </Stack>

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
                            "To aim for the equality and quality of the voting process, we use quadratic voting, which divide your total amount of VOT3 for the square root.",
                          )}
                        </Text>
                        <Link href={QUADRATIC_DOCS_URL} target="_blank">
                          <Text
                            fontSize={"14px"}
                            fontWeight={400}
                            as="span"
                            textDecoration={"underline"}
                            color="#004CFC">
                            {t("Learn more")}
                          </Text>
                        </Link>
                      </VStack>
                    </HStack>
                  </>
                )}
              </VStack>
            </Card.Root>
          </VStack>
          <VStack alignItems={"stretch"} flex={1} gap={6}>
            <Text fontSize={"20px"}>{t("Select your vote")}</Text>
            <RadioGroup.Root onValueChange={e => setSelectedVote(e.value)} value={selectedVote}>
              <VStack alignItems={"stretch"}>
                {votes.map(vote => {
                  const selected = vote.id === selectedVote
                  return (
                    <Card.Root
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
                        <RadioGroup.Item value={vote.id}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                        </RadioGroup.Item>
                      </HStack>
                    </Card.Root>
                  )
                })}
              </VStack>
            </RadioGroup.Root>
            <Text fontSize={"20px"}>{t("Add comment")}</Text>
            <Textarea resize={"none"} onChange={handleChangeComment} />
            <Button type="submit" variant="primaryAction" w="full" disabled={!selectedVote}>
              <VoteIcon boxSize={"20px"} color="white" />
              {t("Cast your vote")}
            </Button>
          </VStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
